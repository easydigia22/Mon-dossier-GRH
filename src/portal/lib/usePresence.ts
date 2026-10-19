import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

/**
 * Nombre RÉEL de visiteurs connectés au portail, via Supabase Realtime (presence).
 *
 * - Aucune table ni RLS : la présence est éphémère, gérée en mémoire par Realtime.
 * - Renvoie `null` tant qu'on n'a pas de valeur fiable (Supabase absent, Realtime
 *   indisponible, ou canal pas encore synchronisé) → l'appelant n'affiche rien.
 * - Ne compte que les onglets ouverts sur le portail (pas l'application /app).
 */
export function usePresenceCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const channel = client.channel('portail-presence', {
      config: { presence: { key: id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = channel.presenceState();
          setCount(Object.keys(state).length);
        } catch {
          /* ignore */
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return count;
}
