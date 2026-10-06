/**
 * Service de base de données locale IndexedDB avec repli sécurisé sur LocalStorage
 */

const DB_NAME = 'MonDossierAdministratif_DB';
const DB_VERSION = 1;

export interface AppDatabaseState {
  version: number;
  derniereSauvegarde: string;
  entreprise: any;
  salaries: any[];
  contrats: any[];
  evenementsPresence: any[];
  demandesConges: any[];
  bulletins: any[];
  regles: any[];
  missions: any[];
  tentatives: any[];
  classes: any[];
  procedures?: any[];
  parametresApp: {
    periodeActive: string;
    modePedagogique: 'demonstration' | 'entrainement' | 'evaluation';
    niveau: 'essentiel' | 'avance';
    nomStagiaireActif: string;
  };
}

let dbInstance: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('app_state')) {
        db.createObjectStore('app_state', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result;
      resolve(dbInstance!);
    };

    request.onerror = (event: any) => {
      console.warn('Erreur ouverture IndexedDB, utilisation de localStorage:', event.target.error);
      reject(event.target.error);
    };
  });
}

export async function saveAppState(state: AppDatabaseState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['app_state'], 'readwrite');
      const store = transaction.objectStore('app_state');
      const putRequest = store.put({ key: 'main_state', data: state });

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch {
    // Repli localStorage
    try {
      localStorage.setItem('MDA_APP_STATE', JSON.stringify(state));
    } catch (e) {
      console.error('Erreur sauvegarde locale:', e);
    }
  }
}

export async function loadAppState(): Promise<AppDatabaseState | null> {
  try {
    const db = await openDB();
    const result = await new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(['app_state'], 'readonly');
      const store = transaction.objectStore('app_state');
      const getRequest = store.get('main_state');

      getRequest.onsuccess = () => resolve(getRequest.result ? getRequest.result.data : null);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (result) return result;
  } catch (err) {
    console.warn('Impossible de charger depuis IndexedDB, tentative localStorage:', err);
  }

  // Repli localStorage
  try {
    const stored = localStorage.getItem('MDA_APP_STATE');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erreur lecture localStorage:', e);
  }

  return null;
}

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['app_state'], 'readwrite');
      const store = transaction.objectStore('app_state');
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });
  } catch (e) {
    console.warn('Clear IndexedDB non possible:', e);
  }

  try {
    localStorage.removeItem('MDA_APP_STATE');
  } catch (e) {
    console.error(e);
  }
}
