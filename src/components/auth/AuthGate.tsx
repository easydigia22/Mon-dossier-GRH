import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { supabase } from '../../services/supabase';
import { resetCloudCache } from '../../services/cloudSync';
import { clearAllLocalData } from '../../services/db';

interface AuthGateProps {
  children: (ctx: { userEmail?: string; onSignOut?: () => void }) => React.ReactNode;
}

/**
 * Exige une connexion Supabase avant d'afficher l'application.
 * Sans configuration Supabase (variables absentes), l'application fonctionne en mode local.
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  if (!supabase) return <>{children({})}</>;

  if (checking) {
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
    // `key` force une réinitialisation complète de l'état applicatif au changement de compte
    return <React.Fragment key={session.user.id}>{children({ userEmail: session.user.email, onSignOut: signOut })}</React.Fragment>;
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
        const { data, error: err } = await supabase!.auth.signUp({ email, password });
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
          <div>
            <div className="text-sm font-bold text-[#16324F] leading-tight">MON DOSSIER ADMINISTRATIF</div>
            <div className="text-xs text-slate-500">Simulateur RH &amp; Paie — OFPPT</div>
          </div>
        </div>

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
