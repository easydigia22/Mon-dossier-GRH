import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Building2, Download, Loader2, LogIn, LogOut, Plus, UserPlus, Users } from 'lucide-react';
import { Copyright } from '../common/Copyright';
import { LandingView } from '../landing/LandingView';
import { supabase } from '../../services/supabase';
import { resetCloudCache } from '../../services/cloudSync';
import { clearAllLocalData } from '../../services/db';
import { fetchMonProfil, MonProfil, UserRole } from '../../services/profile';
import { fetchMaClasse, rejoindreClasse } from '../../services/classeJoin';
import {
  listerEtablissementsPublics,
  choisirEtablissement,
  proposerEtablissement,
  EtablissementPublic
} from '../../services/etablissements';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import type { MembreClasseLive } from '../../types';

interface AuthGateProps {
  children: (ctx: { userEmail?: string; role?: UserRole; onSignOut?: () => void }) => React.ReactNode;
}

/**
 * Traduit les erreurs techniques d'authentification en messages clairs pour l'utilisateur.
 * En particulier, une panne réseau (fetch échoué) remonte « Load failed » (Safari) ou
 * « Failed to fetch » (Chrome) : on la présente comme un problème de connexion à réessayer.
 */
function messageErreurAuth(brut?: string): string {
  const m = (brut || '').toLowerCase();
  if (
    m.includes('load failed') ||
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('fetch')
  ) {
    return "Connexion au serveur impossible. Vérifiez votre connexion internet puis réessayez dans un instant.";
  }
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous plutôt.';
  if (m.includes('rate limit')) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (m.includes('password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Adresse e-mail invalide.';
  if (m.includes('email not confirmed')) return 'Adresse e-mail non confirmée. Vérifiez votre boîte de réception.';
  return brut || 'Une erreur est survenue. Veuillez réessayer.';
}

/**
 * Exige une connexion Supabase avant d'afficher l'application.
 * Sans configuration Supabase (variables absentes), l'application fonctionne en mode local.
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [profil, setProfil] = useState<MonProfil | undefined>(undefined);
  const [profilErreur, setProfilErreur] = useState<string | null>(null);
  const role = profil?.role;
  // Lu dans le .catch de la revérification de fond, qui ne doit pas dépendre de la
  // valeur capturée à la création de l'effet.
  const profilRef = React.useRef<MonProfil | undefined>(undefined);
  profilRef.current = profil;
  const [maClasse, setMaClasse] = useState<MembreClasseLive | null>(null);
  const [classeLoading, setClasseLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  // La page d'accueil publique précède le formulaire tant que le visiteur n'a pas
  // cliqué « Se connecter » (et seulement s'il n'est pas déjà authentifié).
  const [vueAccueil, setVueAccueil] = useState(true);
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

  // Charger le profil (rôle + statut d'approbation) une fois la session établie.
  // Revérifié au retour de focus : un compte révoqué pendant la session doit
  // retomber sur l'écran d'attente plutôt que de se heurter à des erreurs RLS.
  useEffect(() => {
    if (!session) {
      setProfil(undefined);
      setProfilErreur(null);
      return;
    }
    let cancelled = false;

    const charger = (avecIndicateur: boolean) => {
      fetchMonProfil()
        .then((p) => {
          if (cancelled) return;
          setProfil(p);
          setProfilErreur(null);
        })
        .catch((e) => {
          console.error('Lecture du profil impossible:', e);
          if (cancelled) return;
          // Échec fermé au premier chargement : aucun accès par défaut. Mais un échec
          // de la revérification de fond ne doit pas éjecter un utilisateur déjà entré
          // et emporter son travail en cours ; une vraie révocation, elle, est une
          // lecture RÉUSSIE avec un statut non approuvé, et passe toujours.
          if (avecIndicateur || !profilRef.current) {
            setProfilErreur('Impossible de vérifier votre compte. Vérifiez votre connexion, puis réessayez.');
          }
        });
    };

    charger(true);

    const onFocus = () => charger(false);
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
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

  // Re-lecture du profil après une action qui le modifie (ex. choix d'établissement).
  const rafraichirProfil = async () => {
    try {
      setProfil(await fetchMonProfil());
    } catch (e) {
      console.error('Rafraîchissement du profil impossible:', e);
    }
  };

  if (!supabase) return <>{children({})}</>;

  // Tant que le profil n'est pas connu, on attend : sans cela `role === undefined`
  // est interprété par App.tsx comme le mode local sans compte, donc accès complet.
  if (checking || (session && !profil && !profilErreur) || (session && role === 'stagiaire' && classeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF7F0] relative">
        <Loader2 className="w-6 h-6 animate-spin text-[#1C2459]" />
        <Copyright className="absolute bottom-4 left-0 right-0 px-4" />
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

    if (profilErreur) {
      return <EcranBloquant titre="Compte non vérifiable" message={profilErreur} onSignOut={signOut} />;
    }

    if (profil?.profilAbsent) {
      return (
        <EcranBloquant
          titre="Compte en cours de création"
          message="Votre compte vient d'être créé et n'est pas encore lisible. Patientez quelques instants, puis rechargez la page."
          email={session.user.email}
          onSignOut={signOut}
        />
      );
    }

    // Vaut pour tous les rôles : la garde ci-dessous ne teste que les formateurs,
    // donc sans celle-ci désactiver un stagiaire n'aurait aucun effet.
    if (profil?.statut === 'desactive') {
      return (
        <EcranBloquant
          titre="Compte désactivé"
          message="Votre compte a été désactivé par l'administrateur de l'établissement. Contactez-le si vous pensez qu'il s'agit d'une erreur."
          email={session.user.email}
          onSignOut={signOut}
        />
      );
    }

    // Un formateur doit être rattaché à un établissement avant toute validation :
    // il choisit un centre existant ou en propose un nouveau (qui sera validé par le
    // super-admin). Le super-admin (etablissementId null) n'est jamais concerné.
    if (profil && profil.role === 'formateur' && !profil.etablissementId) {
      return <ChoisirEtablissementScreen onDone={rafraichirProfil} onSignOut={signOut} />;
    }

    if (profil && profil.role === 'formateur' && profil.statut !== 'approuve') {
      const enAttente = profil.statut === 'en_attente';
      return (
        <EcranBloquant
          titre={enAttente ? 'Compte en attente de validation' : 'Demande refusée'}
          message={
            enAttente
              ? "Votre compte formateur a bien été créé. Un administrateur doit le valider avant que vous puissiez accéder à l'application."
              : profil.motifRefus || "Votre demande de compte formateur n'a pas été retenue."
          }
          email={session.user.email}
          onSignOut={signOut}
        />
      );
    }

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
        if (err) setError(messageErreurAuth(err.message));
      } else {
        // Le rôle est transmis en métadonnée ; il est copié côté serveur (trigger) et ne peut
        // plus être modifié par le client ensuite — voir migration profiles_roles.sql.
        const { data, error: err } = await supabase!.auth.signUp({
          email,
          password,
          options: { data: { role: compteRole } }
        });
        if (err) setError(messageErreurAuth(err.message));
        else if (!data.session) setInfo('Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.');
      }
    } catch (err: any) {
      // Erreur réseau non gérée (fetch rejeté) : on affiche un message clair plutôt que « Load failed ».
      setError(messageErreurAuth(err?.message));
    } finally {
      setBusy(false);
    }
  };

  // Visiteur non authentifié : on montre d'abord la page d'accueil publique.
  if (vueAccueil) {
    return (
      <LandingView
        onEntrer={() => setVueAccueil(false)}
        canInstall={canInstall}
        onInstaller={promptInstall}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F0] px-4 relative">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#ECE3D6] rounded-2xl shadow-sm p-6 space-y-4">
        <button
          type="button"
          onClick={() => setVueAccueil(true)}
          className="text-xs text-slate-500 hover:text-[#1C2459] transition-colors"
        >
          ← Retour à l'accueil
        </button>
        <div className="flex items-center gap-3">
          <img
            src="/portal/brand/logo-simulrh.png"
            alt="SIMULRH — Simulateur RH & Paie"
            className="h-10 w-auto shrink-0"
            loading="eager"
            decoding="async"
          />
          <img
            src="/logo-ofppt.jpg"
            alt="Office de la Formation Professionnelle et de la Promotion du Travail"
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#ECE3D6]"
          />
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

        <h1 className="text-lg font-semibold text-[#1C2459]">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>

        <label className="block text-xs font-medium text-slate-700">
          Adresse e-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
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
            className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
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
                      ? 'border-[#149D92] bg-teal-50 text-[#1C2459] font-semibold'
                      : 'border-[#E3D8C8] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input type="radio" name="compteRole" value={r} checked={compteRole === r} onChange={() => setCompteRole(r)} className="sr-only" />
                  {r}
                </label>
              ))}
            </div>
            {compteRole === 'formateur' && (
              <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Un compte formateur doit être validé par l'administrateur avant de pouvoir
                servir. Vous serez prévenu à votre prochaine connexion.
              </p>
            )}
          </fieldset>
        )}

        {error && <p className="text-xs text-[#D64545]" role="alert">{error}</p>}
        {info && <p className="text-xs text-[#149D92]">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-[#1C2459] text-white text-sm font-medium rounded py-2 hover:bg-[#1d4266] disabled:opacity-60 transition-colors"
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
          className="w-full text-xs text-slate-600 hover:text-[#1C2459] underline"
        >
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
      <Copyright className="absolute bottom-4 left-0 right-0 px-4" />
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
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F0] px-4 relative">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#ECE3D6] rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-[#149D92]" />
          <div>
            <div className="text-sm font-bold text-[#1C2459] leading-tight">Rejoindre ma classe</div>
            <div className="text-xs text-slate-500">Demandez le code à votre formateur</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          En rejoignant une classe, vous permettez à votre formateur de consulter votre dossier de
          travail pour le corriger. Il ne peut rien y modifier.
        </p>

        <label className="block text-xs font-medium text-slate-700">
          Code de classe
          <input
            type="text"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: 7K9QXM"
            className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#149D92]"
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
              className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Prénom
            <input
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
            />
          </label>
        </div>
        <label className="block text-xs font-medium text-slate-700">
          Matricule (optionnel)
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#149D92]"
          />
        </label>

        {error && <p className="text-xs text-[#D64545]" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-[#1C2459] text-white text-sm font-medium rounded py-2 hover:bg-[#1d4266] disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Rejoindre la classe
        </button>

        <button type="button" onClick={onSignOut} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-[#D64545]">
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </form>
      <Copyright className="absolute bottom-4 left-0 right-0 px-4" />
    </div>
  );
};

interface ChoisirEtablissementScreenProps {
  onDone: () => void;
  onSignOut: () => void;
}

/**
 * Étape obligatoire pour un formateur pas encore rattaché : rejoindre un établissement
 * existant OU en proposer un nouveau (qui passera en validation du super-admin).
 */
const ChoisirEtablissementScreen: React.FC<ChoisirEtablissementScreenProps> = ({ onDone, onSignOut }) => {
  const [mode, setMode] = useState<'existant' | 'nouveau'>('existant');
  const [liste, setListe] = useState<EtablissementPublic[]>([]);
  const [listeLoading, setListeLoading] = useState(true);
  const [choixId, setChoixId] = useState('');
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listerEtablissementsPublics()
      .then((l) => {
        setListe(l);
        if (l.length > 0) setChoixId(l[0].id);
        else setMode('nouveau');
      })
      .catch((e) => setError(e.message))
      .finally(() => setListeLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'existant') {
        if (!choixId) throw new Error('Sélectionnez un établissement.');
        await choisirEtablissement(choixId);
      } else {
        if (!nom.trim()) throw new Error("Indiquez le nom de l'établissement.");
        await proposerEtablissement(nom.trim(), ville.trim() || undefined);
      }
      onDone();
    } catch (e: any) {
      setError(e.message || 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F0] px-4 relative">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#ECE3D6] rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-[#149D92]" />
          <div>
            <div className="text-sm font-bold text-[#1C2459] leading-tight">Votre établissement</div>
            <div className="text-xs text-slate-500">Rattachez votre compte formateur à un centre</div>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          {(['existant', 'nouveau'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 border rounded-lg font-semibold transition-colors ${
                mode === m ? 'border-[#149D92] bg-teal-50 text-[#1C2459]' : 'border-[#E3D8C8] text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m === 'existant' ? 'Rejoindre un centre' : 'Créer mon centre'}
            </button>
          ))}
        </div>

        {mode === 'existant' ? (
          <label className="block text-xs font-medium text-slate-700">
            Établissement
            {listeLoading ? (
              <div className="mt-1 flex items-center gap-2 text-slate-400 text-xs"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
            ) : liste.length === 0 ? (
              <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Aucun établissement disponible. Créez le vôtre dans l'onglet « Créer mon centre ».
              </p>
            ) : (
              <select
                value={choixId}
                onChange={(e) => setChoixId(e.target.value)}
                className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm"
              >
                {liste.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}{e.ville ? ` — ${e.ville}` : ''}</option>
                ))}
              </select>
            )}
          </label>
        ) : (
          <>
            <label className="block text-xs font-medium text-slate-700">
              Nom de l'établissement
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: ISTA Marrakech Guéliz - OFPPT"
                className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Ville (optionnel)
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Marrakech"
                className="mt-1 w-full border border-[#E3D8C8] rounded px-3 py-2 text-sm"
              />
            </label>
            <p className="text-[11px] text-slate-500">
              Le centre que vous créez sera validé par l'administrateur de la plateforme avant
              d'être actif.
            </p>
          </>
        )}

        {error && <p className="text-xs text-[#D64545]" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-[#1C2459] text-white text-sm font-medium rounded py-2 hover:bg-[#1d4266] disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {mode === 'existant' ? 'Rejoindre cet établissement' : "Créer et continuer"}
        </button>

        <button type="button" onClick={onSignOut} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-[#D64545]">
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </form>
      <Copyright className="absolute bottom-4 left-0 right-0 px-4" />
    </div>
  );
};

const EcranBloquant: React.FC<{
  titre: string;
  message: string;
  email?: string;
  onSignOut: () => void;
}> = ({ titre, message, email, onSignOut }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#FBF7F0] px-4 relative">
    <div className="w-full max-w-sm bg-white border border-[#ECE3D6] rounded-2xl shadow-sm p-6 space-y-4 text-center">
      <div className="flex justify-center">
        <img
          src="/portal/brand/logo-simulrh.png"
          alt="SIMULRH — Simulateur RH & Paie"
          className="h-10 w-auto"
          loading="eager"
          decoding="async"
        />
      </div>
      <h1 className="text-base font-bold text-[#1C2459]">{titre}</h1>
      <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
      {email && <p className="text-[11px] text-slate-400">Compte : {email}</p>}
      <button
        onClick={onSignOut}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C2459] hover:bg-[#161c47] text-white text-xs font-semibold rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
    <Copyright className="absolute bottom-4 left-0 right-0 px-4" />
  </div>
);
