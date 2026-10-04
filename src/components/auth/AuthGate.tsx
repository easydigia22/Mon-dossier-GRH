import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Download, Loader2, LogIn, LogOut, UserPlus, Users } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { supabase } from '../../services/supabase';
import { resetCloudCache } from '../../services/cloudSync';
import { clearAllLocalData } from '../../services/db';
import { fetchMyRole, UserRole } from '../../services/profile';
import { fetchMaClasse, rejoindreClasse } from '../../services/classeJoin';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import type { MembreClasseLive } from '../../types';

interface AuthGateProps {
  children: (ctx: { userEmail?: string; role?: UserRole; onSignOut?: () => void }) => React.ReactNode;
}

/**
 * Exige une connexion Supabase avant d'afficher l'application.
 * Sans configuration Supabase (variables absentes), l'application fonctionne en mode local.
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [roleLoading, setRoleLoading] = useState(false);
  const [maClasse, setMaClasse] = useState<MembreClasseLive | null>(null);
  const [classeLoading, setClasseLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [compteRole, setCompteRole] = useState<UserRole>('stagiaire');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Charger le rôle (stagiaire / formateur) une fois la session établie
  useEffect(() => {
    if (!session) {
      setRole(undefined);
      return;
    }
    let cancelled = false;
    setRoleLoading(true);
    fetchMyRole()
      .then((r) => {
        if (!cancelled) setRole(r);
      })
      .catch((e) => {
        console.error('Lecture du rôle impossible, repli sur « stagiaire »:', e);
        if (!cancelled) setRole('stagiaire');
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  // Pour un stagiaire : vérifier qu'il a rejoint une classe (sinon, on le lui demandera)
  useEffect(() => {
    if (!session || role !== 'stagiaire') {
      setMaClasse(null);
      return;
    }
    let cancelled = false;
    setClasseLoading(true);
    fetchMaClasse()
      .then((c) => {
        if (!cancelled) setMaClasse(c);
      })
      .catch((e) => console.error('Lecture de la classe impossible:', e))
      .finally(() => {
        if (!cancelled) setClasseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, role]);

  if (!supabase) return <>{children({})}</>;

  if (checking || (session && roleLoading) || (session && role === 'stagiaire' && classeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
        <Loader2 className="w-6 h-6 animate-spin text-[#16324F]" />
      </div>
    );
  }

  if (session) {
    const signOut = async () => {
      await supabase!.auth.signOut();
      // Évite qu'un autre compte du même navigateur reprenne la copie locale
      await clearAllLocalData();
      resetCloudCache();
    };

    if (role === 'stagiaire' && !maClasse) {
      return <JoinClasseScreen onJoined={setMaClasse} onSignOut={signOut} />;
    }

    // `key` force une réinitialisation complète de l'état applicatif au changement de compte
    return (
      <React.Fragment key={session.user.id}>
        {children({ userEmail: session.user.email, role, onSignOut: signOut })}
      </React.Fragment>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
        if (err) setError(err.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : err.message);
      } else {
        // Le rôle est transmis en métadonnée ; il est copié côté serveur (trigger) et ne peut
        // plus être modifié par le client ensuite — voir migration profiles_roles.sql.
        const { data, error: err } = await supabase!.auth.signUp({
          email,
          password,
          options: { data: { role: compteRole } }
        });
        if (err) setError(err.message);
        else if (!data.session) setInfo('Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AppLogo size={40} />
          <img
            src="/logo-ofppt.jpg"
            alt="Office de la Formation Professionnelle et de la Promotion du Travail"
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
          />
          <div>
            <div className="text-sm font-bold text-[#16324F] leading-tight">MON DOSSIER ADMINISTRATIF</div>
            <div className="text-xs text-slate-500">Simulateur RH &amp; Paie — OFPPT</div>
          </div>
        </div>

        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-2 bg-[#149D92] text-white text-xs font-semibold rounded py-2 hover:bg-[#108a80] transition-colors"
          >
            <Download className="w-4 h-4" />
            Installer l'application sur cet appareil
          </button>
        )}
        {isInstalled && (
          <p className="text-[11px] text-[#149D92] text-center -mt-1">Application installée sur cet appareil ✓</p>
        )}

        <h1 className="text-lg font-semibold text-[#16324F]">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>

        <label className="block text-xs font-medium text-slate-700">
          Adresse e-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
          />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Mot de passe
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
          />
        </label>

        {mode === 'signup' && (
          <fieldset className="text-xs">
            <legend className="font-medium text-slate-700 mb-1">Je m'inscris en tant que</legend>
            <div className="flex gap-2">
              {(['stagiaire', 'formateur'] as const).map((r) => (
                <label
                  key={r}
                  className={`flex-1 text-center px-3 py-2 border rounded cursor-pointer capitalize transition-colors ${
                    compteRole === r
                      ? 'border-[#149D92] bg-teal-50 text-[#16324F] font-semibold'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input type="radio" name="compteRole" value={r} checked={compteRole === r} onChange={() => setCompteRole(r)} className="sr-only" />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && <p className="text-xs text-[#D64545]" role="alert">{error}</p>}
        {info && <p className="text-xs text-[#149D92]">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-[#16324F] text-white text-sm font-medium rounded py-2 hover:bg-[#1d4266] disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            setInfo(null);
          }}
          className="w-full text-xs text-slate-600 hover:text-[#16324F] underline"
        >
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  );
};

interface JoinClasseScreenProps {
  onJoined: (c: MembreClasseLive) => void;
  onSignOut: () => void;
}

/** Étape obligatoire pour un compte stagiaire sans classe : saisir le code fourni par le formateur. */
const JoinClasseScreen: React.FC<JoinClasseScreenProps> = ({ onJoined, onSignOut }) => {
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await rejoindreClasse(code, nom, prenom, matricule);
      const c = await fetchMaClasse();
      if (c) onJoined(c);
      else setError("Le rattachement a échoué, veuillez réessayer.");
    } catch (e: any) {
      setError(e.message || 'Code invalide.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-[#149D92]" />
          <div>
            <div className="text-sm font-bold text-[#16324F] leading-tight">Rejoindre ma classe</div>
            <div className="text-xs text-slate-500">Demandez le code à votre formateur</div>
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-700">
          Code de classe
          <input
            type="text"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: 7K9QXM"
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#149D92]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-slate-700">
            Nom
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Prénom
            <input
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
            />
          </label>
        </div>
        <label className="block text-xs font-medium text-slate-700">
          Matricule (optionnel)
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
          />
        </label>

        {error && <p className="text-xs text-[#D64545]" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-[#16324F] text-white text-sm font-medium rounded py-2 hover:bg-[#1d4266] disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Rejoindre la classe
        </button>

        <button type="button" onClick={onSignOut} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-[#D64545]">
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </form>
    </div>
  );
};
