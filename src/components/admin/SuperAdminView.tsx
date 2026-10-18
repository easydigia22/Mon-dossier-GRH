import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Check, X, ShieldCheck, Loader2, RefreshCw, KeyRound, Users, ArrowRightLeft } from 'lucide-react';
import { Card, Button, Badge, SectionTitle } from '../ui/kit';
import {
  Etablissement,
  CompteEtablissement,
  fetchEtablissements,
  creerEtablissement,
  deciderEtablissement,
  designerAdminEtablissement,
  reaffecterCompteEtablissement,
  fetchComptesParEtablissement
} from '../../services/etablissements';

interface SuperAdminViewProps {
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

/** Espace réservé au super-administrateur : gestion des établissements (tenants). */
export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ showNotification }) => {
  const [etabs, setEtabs] = useState<Etablissement[]>([]);
  const [chargement, setChargement] = useState(false);
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [busy, setBusy] = useState(false);

  // Panneau « gérer l'admin » ouvert pour un établissement donné.
  const [gereId, setGereId] = useState<string | null>(null);
  const [comptes, setComptes] = useState<CompteEtablissement[]>([]);
  const [comptesLoading, setComptesLoading] = useState(false);
  // Destination choisie par compte pour la réaffectation.
  const [deplacerVers, setDeplacerVers] = useState<Record<string, string>>({});

  const charger = async () => {
    setChargement(true);
    try {
      setEtabs(await fetchEtablissements());
    } catch (e: any) {
      showNotification(`Chargement impossible : ${e.message}`, 'error');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enAttente = useMemo(() => etabs.filter((e) => e.statut === 'en_attente'), [etabs]);
  const actifs = useMemo(() => etabs.filter((e) => e.statut !== 'en_attente'), [etabs]);

  const handleCreer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setBusy(true);
    try {
      await creerEtablissement(nom.trim(), ville.trim() || undefined);
      setNom('');
      setVille('');
      showNotification('Établissement créé.', 'success');
      await charger();
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (id: string, decision: 'approuve' | 'refuse') => {
    try {
      await deciderEtablissement(id, decision);
      showNotification(decision === 'approuve' ? 'Établissement approuvé.' : 'Établissement refusé.', 'success');
      await charger();
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  const ouvrirGestionAdmin = async (id: string) => {
    if (gereId === id) {
      setGereId(null);
      return;
    }
    setGereId(id);
    setComptesLoading(true);
    try {
      setComptes(await fetchComptesParEtablissement(id));
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setComptesLoading(false);
    }
  };

  const handleDesignerAdmin = async (userId: string, etabId: string) => {
    try {
      await designerAdminEtablissement(userId, etabId);
      showNotification('Admin désigné pour cet établissement.', 'success');
      setComptes(await fetchComptesParEtablissement(etabId));
      await charger();
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  const handleDeplacer = async (userId: string, sourceEtabId: string) => {
    const dest = deplacerVers[userId];
    if (!dest) {
      showNotification('Choisissez un établissement de destination.', 'warning');
      return;
    }
    try {
      await reaffecterCompteEtablissement(userId, dest);
      showNotification('Compte réaffecté (classes et stagiaires inclus).', 'success');
      // Le compte quitte l'établissement courant : on recharge la liste affichée.
      setComptes(await fetchComptesParEtablissement(sourceEtabId));
      setDeplacerVers((m) => {
        const n = { ...m };
        delete n[userId];
        return n;
      });
      await charger();
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  // Établissements approuvés, hors celui affiché, pour les destinations.
  const destinations = (sauf: string) => etabs.filter((e) => e.statut === 'approuve' && e.id !== sauf);

  const LigneEtab: React.FC<{ e: Etablissement }> = ({ e }) => (
    <div className="border border-[#ECE3D6] rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1C2459]">{e.nom}</span>
            {e.statut === 'approuve' && <Badge tone="success">Approuvé</Badge>}
            {e.statut === 'en_attente' && <Badge tone="safran">En attente</Badge>}
            {e.statut === 'refuse' && <Badge tone="danger">Refusé</Badge>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {e.ville && <span>{e.ville}</span>}
            {e.code && (
              <span className="inline-flex items-center gap-1 font-mono">
                <KeyRound className="w-3 h-3" /> {e.code}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {e.statut === 'en_attente' ? (
            <>
              <Button variant="primary" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleDecision(e.id, 'approuve')}>
                Approuver
              </Button>
              <Button variant="ghost" icon={<X className="w-3.5 h-3.5" />} onClick={() => handleDecision(e.id, 'refuse')}>
                Refuser
              </Button>
            </>
          ) : (
            <Button variant="ghost" icon={<Users className="w-3.5 h-3.5" />} onClick={() => ouvrirGestionAdmin(e.id)}>
              {gereId === e.id ? 'Fermer' : "Gérer l'admin"}
            </Button>
          )}
        </div>
      </div>

      {gereId === e.id && (
        <div className="mt-3 pt-3 border-t border-[#F3ECE1]">
          {comptesLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des comptes…
            </div>
          ) : comptes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun compte rattaché à cet établissement.</p>
          ) : (
            <div className="space-y-2.5">
              {comptes.map((c) => {
                const dests = destinations(e.id);
                return (
                  <div key={c.userId} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between gap-x-3 text-xs">
                    <span className="min-w-0 truncate">
                      <span className="text-slate-700">{c.email}</span>
                      <span className="ml-2 text-[10px] uppercase font-bold text-slate-400">{c.role}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.role === 'admin' ? (
                        <Badge tone="navy" icon={<ShieldCheck className="w-3 h-3" />}>Admin actuel</Badge>
                      ) : c.role === 'formateur' || c.role === 'stagiaire' ? (
                        <button
                          onClick={() => handleDesignerAdmin(c.userId, e.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#1C2459] hover:bg-[#161c47] text-white text-[11px] font-semibold transition-colors"
                        >
                          Désigner admin
                        </button>
                      ) : null}

                      {dests.length > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <select
                            value={deplacerVers[c.userId] ?? ''}
                            onChange={(ev) => setDeplacerVers((m) => ({ ...m, [c.userId]: ev.target.value }))}
                            className="border border-[#ECE3D6] rounded-lg px-2 py-1 text-[11px] bg-white max-w-[9rem] truncate"
                            title="Déplacer vers un autre établissement"
                          >
                            <option value="">Déplacer vers…</option>
                            {dests.map((d) => (
                              <option key={d.id} value={d.id}>{d.nom}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeplacer(c.userId, e.id)}
                            disabled={!deplacerVers[c.userId]}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#C96A4B] hover:bg-[#B4563B] disabled:opacity-40 text-white text-[11px] font-semibold transition-colors"
                            title="Réaffecter ce compte (classes et stagiaires inclus)"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Déplacer
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle
          icon={<Plus className="w-4 h-4" />}
          title="Créer un établissement"
          subtitle="Le code généré permet aux formateurs de rejoindre ce centre."
        />
        <form onSubmit={handleCreer} className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-700">
            Nom de l'établissement
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex: ISTA Marrakech Guéliz - OFPPT"
              className="mt-1 block w-72 max-w-full border border-[#ECE3D6] rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Ville (optionnel)
            <input
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Marrakech"
              className="mt-1 block w-48 max-w-full border border-[#ECE3D6] rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <Button variant="primary" icon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} disabled={busy}>
            Créer
          </Button>
        </form>
      </Card>

      {enAttente.length > 0 && (
        <Card accent="safran" className="p-6">
          <SectionTitle
            icon={<Building2 className="w-4 h-4" />}
            title={`Établissements en attente (${enAttente.length})`}
            subtitle="Proposés par des formateurs à l'inscription — à approuver ou refuser."
          />
          <div className="space-y-3">
            {enAttente.map((e) => <LigneEtab key={e.id} e={e} />)}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <SectionTitle
          icon={<Building2 className="w-4 h-4" />}
          title="Établissements"
          subtitle="Approuvés et refusés — désignez l'admin de chaque centre."
          right={
            <button onClick={charger} className="text-xs font-semibold text-[#149D92] hover:underline inline-flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
          }
        />
        {chargement && etabs.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : actifs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun établissement pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {actifs.map((e) => <LigneEtab key={e.id} e={e} />)}
          </div>
        )}
      </Card>
    </div>
  );
};
