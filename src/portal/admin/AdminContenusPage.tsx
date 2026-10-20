import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LogOut, Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Upload, Save, X, Check, Star, FileText, MessageSquareQuote, Users, Download } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { fetchMonProfil } from '../../services/profile';
import { useSeo } from '../lib/seo';
import {
  fetchTousContenusAdmin,
  enregistrerContenu,
  supprimerContenu,
  uploadFichier,
} from '../content/supabaseContent';
import { RUBRIQUES } from '../lib/rubriques';
import {
  fetchAvisAdmin,
  changerStatutAvis,
  supprimerAvis,
  type AvisAdmin,
  type StatutAvis,
} from '../lib/avis';
import {
  fetchLeadsAdmin,
  supprimerLead,
  leadsVersCsv,
  type Lead,
  type SourceLead,
} from '../lib/leads';
import type {
  Contenu, TypeContenu, Rubrique, Public, Niveau, StatutContenu, QuestionQcm, FichierTelechargeable,
} from '../content/types';

const TYPES: { v: TypeContenu; label: string }[] = [
  { v: 'cours', label: 'Cours' },
  { v: 'exercice', label: 'Exercice' },
  { v: 'qcm', label: 'QCM' },
  { v: 'article', label: 'Article' },
  { v: 'ressource', label: 'Ressource' },
];
const PUBLICS: Public[] = ['etudiant', 'stagiaire', 'formateur', 'professionnel'];
const NIVEAUX: Niveau[] = ['debutant', 'intermediaire', 'avance'];
const STATUTS: StatutContenu[] = ['brouillon', 'publie', 'depublie'];

const champ = 'w-full border border-[#E3D8C8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function contenuVide(): Contenu {
  return {
    id: '',
    slug: '',
    type: 'cours',
    rubrique: 'grh',
    titre: '',
    resume: '',
    publics: ['stagiaire'],
    niveau: 'debutant',
    statut: 'brouillon',
    demo: false,
    tags: [],
  };
}

// ---------------------------------------------------------------------------
// Page : gère l'accès (Supabase configuré, connecté, administrateur).
// ---------------------------------------------------------------------------
export const AdminContenusPage: React.FC = () => {
  useSeo({ titre: 'Administration des contenus', description: 'Espace réservé.' });
  const [checking, setChecking] = useState(true);
  const [connecte, setConnecte] = useState(false);
  const [estAdmin, setEstAdmin] = useState(false);

  const verifier = async () => {
    setChecking(true);
    if (!supabase) {
      setChecking(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const ok = !!data.session;
    setConnecte(ok);
    if (ok) {
      try {
        const p = await fetchMonProfil();
        setEstAdmin(p.role === 'admin' || p.role === 'superadmin');
      } catch {
        setEstAdmin(false);
      }
    }
    setChecking(false);
  };

  useEffect(() => {
    verifier();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => verifier());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <Cadre>
        <h1 className="font-display text-2xl font-bold text-navy mb-3">CMS non configuré</h1>
        <p className="text-ink/70">
          La connexion à Supabase n'est pas configurée sur ce déploiement. L'administration des
          contenus nécessite Supabase (variables d'environnement) et l'exécution de la migration
          <code className="mx-1 px-1 bg-sand rounded">portail_contenus</code>.
        </p>
      </Cadre>
    );
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-navy" />
      </div>
    );
  }

  if (!connecte) return <LoginForm onDone={verifier} />;

  if (!estAdmin) {
    return (
      <Cadre>
        <h1 className="font-display text-2xl font-bold text-navy mb-3">Accès réservé</h1>
        <p className="text-ink/70 mb-4">
          Votre compte n'a pas le rôle administrateur nécessaire pour gérer les contenus du portail.
        </p>
        <button onClick={() => supabase!.auth.signOut()} className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-danger">
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </Cadre>
    );
  }

  return <AdminCms />;
};

const Cadre: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-2xl mx-auto px-4 py-16">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy mb-6">
      <ArrowLeft className="w-4 h-4" /> Retour au site
    </Link>
    <div className="card-soft p-8">{children}</div>
  </div>
);

const LoginForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
    if (err) setError(err.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : err.message);
    else onDone();
    setBusy(false);
  };

  return (
    <Cadre>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Administration</h1>
      <p className="text-ink/60 text-sm mb-6">Connectez-vous avec votre compte administrateur.</p>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required placeholder="Adresse e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} />
        <input type="password" required placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={champ} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="w-full bg-navy text-white font-semibold rounded-lg py-2.5 hover:bg-navy-deep disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Se connecter
        </button>
      </form>
    </Cadre>
  );
};

// ---------------------------------------------------------------------------
// CMS : liste + éditeur
// ---------------------------------------------------------------------------
const AdminCms: React.FC = () => {
  const [vue, setVue] = useState<'contenus' | 'avis' | 'leads'>('contenus');
  const [contenus, setContenus] = useState<Contenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [edite, setEdite] = useState<Contenu | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      setContenus(await fetchTousContenusAdmin());
    } catch (e: any) {
      setErreur(e.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const basculerStatut = async (c: Contenu) => {
    const statut: StatutContenu = c.statut === 'publie' ? 'depublie' : 'publie';
    try {
      await enregistrerContenu({ ...c, statut });
      charger();
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  const supprimer = async (c: Contenu) => {
    if (!window.confirm(`Supprimer définitivement « ${c.titre} » ?`)) return;
    try {
      await supprimerContenu(c.id);
      charger();
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  if (edite) {
    return (
      <EditeurContenu
        initial={edite}
        onAnnuler={() => setEdite(null)}
        onEnregistre={() => {
          setEdite(null);
          charger();
        }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy mb-2">
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy">Administration du portail</h1>
        </div>
        <div className="flex items-center gap-3">
          {vue === 'contenus' && (
            <button onClick={() => setEdite(contenuVide())} className="inline-flex items-center gap-2 bg-navy text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-navy-deep">
              <Plus className="w-4 h-4" /> Nouveau contenu
            </button>
          )}
          <button onClick={() => supabase!.auth.signOut()} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-danger">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-[#ECE3D6]">
        <button
          onClick={() => setVue('contenus')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            vue === 'contenus' ? 'border-teal text-navy' : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          <FileText className="w-4 h-4" /> Contenus
        </button>
        <button
          onClick={() => setVue('avis')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            vue === 'avis' ? 'border-teal text-navy' : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" /> Avis
        </button>
        <button
          onClick={() => setVue('leads')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            vue === 'leads' ? 'border-teal text-navy' : 'border-transparent text-ink/50 hover:text-ink/80'
          }`}
        >
          <Users className="w-4 h-4" /> Leads
        </button>
      </div>

      {vue === 'leads' ? (
        <AdminLeadsPanel />
      ) : vue === 'avis' ? (
        <AdminAvisPanel />
      ) : (
      <>
      {erreur && <p className="mb-4 text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erreur}</p>}

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-navy mx-auto" /></div>
      ) : contenus.length === 0 ? (
        <div className="card-soft p-10 text-center text-ink/60">Aucun contenu pour le moment. Cliquez sur « Nouveau contenu ».</div>
      ) : (
        <div className="space-y-2">
          {contenus.map((c) => (
            <div key={c.id} className="card-soft p-4 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy truncate">{c.titre}</p>
                <p className="text-[12.5px] text-ink/55">
                  {c.type} · {c.rubrique} ·{' '}
                  <span className={c.statut === 'publie' ? 'text-success font-medium' : c.statut === 'depublie' ? 'text-danger' : 'text-ink/50'}>
                    {c.statut}
                  </span>
                </p>
              </div>
              <button onClick={() => basculerStatut(c)} title={c.statut === 'publie' ? 'Dépublier' : 'Publier'} className="p-2 rounded-lg hover:bg-sand text-ink/70">
                {c.statut === 'publie' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => setEdite(c)} title="Modifier" className="p-2 rounded-lg hover:bg-sand text-ink/70">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => supprimer(c)} title="Supprimer" className="p-2 rounded-lg hover:bg-red-50 text-danger">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Panneau de modération des avis
// ---------------------------------------------------------------------------
const STATUT_LABEL: Record<StatutAvis, { texte: string; classe: string }> = {
  en_attente: { texte: 'En attente', classe: 'text-amber-600' },
  publie: { texte: 'Publié', classe: 'text-success font-medium' },
  rejete: { texte: 'Rejeté', classe: 'text-danger' },
};

const AdminAvisPanel: React.FC = () => {
  const [avis, setAvis] = useState<AvisAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      setAvis(await fetchAvisAdmin());
    } catch (e: any) {
      setErreur(e.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const changer = async (id: string, statut: StatutAvis) => {
    try {
      await changerStatutAvis(id, statut);
      charger();
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  const supprimer = async (a: AvisAdmin) => {
    if (!window.confirm(`Supprimer définitivement l'avis de « ${a.prenom} » ?`)) return;
    try {
      await supprimerAvis(a.id);
      charger();
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  const enAttente = avis.filter((a) => a.statut === 'en_attente').length;

  return (
    <div>
      {erreur && <p className="mb-4 text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erreur}</p>}

      <p className="text-sm text-ink/60 mb-4">
        Avis soumis par les visiteurs. Seuls les avis <span className="font-medium text-success">publiés</span> apparaissent
        sur le portail.{enAttente > 0 && <> {enAttente} avis en attente de votre validation.</>}
      </p>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-navy mx-auto" /></div>
      ) : avis.length === 0 ? (
        <div className="card-soft p-10 text-center text-ink/60">
          Aucun avis pour le moment. Les avis envoyés via le formulaire d'accueil apparaîtront ici.
        </div>
      ) : (
        <div className="space-y-2">
          {avis.map((a) => (
            <div key={a.id} className="card-soft p-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] text-ink/85 leading-relaxed">« {a.texte} »</p>
                  <p className="mt-2 text-sm font-semibold text-navy">
                    {a.prenom} <span className="font-normal text-ink/60">— {a.qualite}</span>
                  </p>
                  <p className="text-[12.5px] text-ink/50 mt-1 flex items-center gap-2 flex-wrap">
                    <span className={STATUT_LABEL[a.statut].classe}>{STATUT_LABEL[a.statut].texte}</span>
                    {a.note ? (
                      <span className="inline-flex items-center gap-0.5 text-amber-500">
                        {a.note}<Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </span>
                    ) : null}
                    <span>· {new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {a.statut !== 'publie' && (
                    <button onClick={() => changer(a.id, 'publie')} title="Publier" className="p-2 rounded-lg hover:bg-green-50 text-success">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {a.statut === 'publie' && (
                    <button onClick={() => changer(a.id, 'en_attente')} title="Dépublier (remettre en attente)" className="p-2 rounded-lg hover:bg-sand text-ink/70">
                      <EyeOff className="w-4 h-4" />
                    </button>
                  )}
                  {a.statut !== 'rejete' && (
                    <button onClick={() => changer(a.id, 'rejete')} title="Rejeter" className="p-2 rounded-lg hover:bg-red-50 text-ink/60">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => supprimer(a)} title="Supprimer" className="p-2 rounded-lg hover:bg-red-50 text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Panneau des leads (newsletter + guide) + export CSV
// ---------------------------------------------------------------------------
const SOURCE_LABEL: Record<SourceLead, string> = {
  newsletter: 'Newsletter',
  'guide-paie': 'Guide paie',
  autre: 'Autre',
};

const AdminLeadsPanel: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      setLeads(await fetchLeadsAdmin());
    } catch (e: any) {
      setErreur(e.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (l: Lead) => {
    if (!window.confirm(`Supprimer définitivement le lead « ${l.email} » ?`)) return;
    try {
      await supprimerLead(l.id);
      charger();
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  const exporterCsv = () => {
    const csv = leadsVersCsv(leads);
    // BOM UTF-8 pour qu'Excel lise correctement les accents.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-simulrh-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {erreur && <p className="mb-4 text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erreur}</p>}

      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <p className="text-sm text-ink/60">
          {leads.length} contact{leads.length > 1 ? 's' : ''} opt-in. Données personnelles —
          lecture réservée à l'administration.
        </p>
        <button
          onClick={exporterCsv}
          disabled={leads.length === 0}
          className="inline-flex items-center gap-2 bg-navy text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-navy-deep disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exporter en CSV
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-navy mx-auto" /></div>
      ) : leads.length === 0 ? (
        <div className="card-soft p-10 text-center text-ink/60">
          Aucun lead pour le moment. Les inscriptions (newsletter, guide) apparaîtront ici.
        </div>
      ) : (
        <div className="card-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/55 border-b border-[#ECE3D6]">
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Prénom</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-[#F2EADF] last:border-0">
                  <td className="px-4 py-3 text-navy font-medium">
                    <a href={`mailto:${l.email}`} className="hover:underline">{l.email}</a>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{l.prenom || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] px-2 py-0.5 rounded-full bg-teal-soft text-navy">{SOURCE_LABEL[l.source]}</span>
                  </td>
                  <td className="px-4 py-3 text-ink/55">{new Date(l.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => supprimer(l)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Éditeur d'un contenu
// ---------------------------------------------------------------------------
const EditeurContenu: React.FC<{ initial: Contenu; onAnnuler: () => void; onEnregistre: () => void }> = ({
  initial,
  onAnnuler,
  onEnregistre,
}) => {
  const [c, setC] = useState<Contenu>(initial);
  const [slugTouche, setSlugTouche] = useState(!!initial.slug);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const maj = (patch: Partial<Contenu>) => setC((prev) => ({ ...prev, ...patch }));

  const majTitre = (titre: string) => {
    maj({ titre, ...(slugTouche ? {} : { slug: slugify(titre) }) });
  };

  const togglePublic = (p: Public) =>
    maj({ publics: c.publics.includes(p) ? c.publics.filter((x) => x !== p) : [...c.publics, p] });

  const enregistrer = async () => {
    setErreur(null);
    if (!c.titre.trim() || !c.slug.trim()) {
      setErreur('Le titre et le slug sont obligatoires.');
      return;
    }
    setBusy(true);
    try {
      await enregistrerContenu(c);
      onEnregistre();
    } catch (e: any) {
      setErreur(e.message?.includes('duplicate') ? 'Ce slug existe déjà, choisissez-en un autre.' : e.message || 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={onAnnuler} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </button>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">{initial.id ? 'Modifier le contenu' : 'Nouveau contenu'}</h1>

      <div className="space-y-4">
        <Label texte="Titre">
          <input className={champ} value={c.titre} onChange={(e) => majTitre(e.target.value)} />
        </Label>
        <Label texte="Slug (adresse de la page)">
          <input className={champ} value={c.slug} onChange={(e) => { setSlugTouche(true); maj({ slug: slugify(e.target.value) }); }} />
        </Label>

        <div className="grid sm:grid-cols-3 gap-4">
          <Label texte="Type">
            <select className={champ} value={c.type} onChange={(e) => maj({ type: e.target.value as TypeContenu })}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </Label>
          <Label texte="Rubrique">
            <select className={champ} value={c.rubrique} onChange={(e) => maj({ rubrique: e.target.value as Rubrique })}>
              {RUBRIQUES.map((r) => <option key={r.cle} value={r.cle}>{r.label}</option>)}
            </select>
          </Label>
          <Label texte="Niveau">
            <select className={champ} value={c.niveau} onChange={(e) => maj({ niveau: e.target.value as Niveau })}>
              {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Label>
        </div>

        <Label texte="Résumé">
          <textarea className={champ} rows={2} value={c.resume} onChange={(e) => maj({ resume: e.target.value })} />
        </Label>

        <div className="grid sm:grid-cols-2 gap-4">
          <Label texte="Public visé">
            <div className="flex flex-wrap gap-2 pt-1">
              {PUBLICS.map((p) => (
                <button key={p} type="button" onClick={() => togglePublic(p)} className={`text-xs px-2.5 py-1.5 rounded-full border ${c.publics.includes(p) ? 'bg-teal-soft border-teal text-navy' : 'border-[#E3D8C8] text-ink/60'}`}>
                  {p}
                </button>
              ))}
            </div>
          </Label>
          <Label texte="Statut">
            <select className={champ} value={c.statut} onChange={(e) => maj({ statut: e.target.value as StatutContenu })}>
              {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Label texte="Auteur (optionnel)">
            <input className={champ} value={c.auteur ?? ''} onChange={(e) => maj({ auteur: e.target.value })} />
          </Label>
          <Label texte="Tags (séparés par des virgules)">
            <input className={champ} value={(c.tags ?? []).join(', ')} onChange={(e) => maj({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
          </Label>
        </div>

        {(c.type === 'cours' || c.type === 'article') && (
          <Label texte="Corps (Markdown léger : ## titres, - listes, **gras**)">
            <textarea className={champ} rows={10} value={c.corps ?? ''} onChange={(e) => maj({ corps: e.target.value })} />
          </Label>
        )}

        {c.type === 'exercice' && (
          <>
            <Label texte="Énoncé"><textarea className={champ} rows={4} value={c.enonce ?? ''} onChange={(e) => maj({ enonce: e.target.value })} /></Label>
            <Label texte="Correction"><textarea className={champ} rows={4} value={c.correction ?? ''} onChange={(e) => maj({ correction: e.target.value })} /></Label>
          </>
        )}

        {c.type === 'qcm' && <EditeurQcm questions={c.questions ?? []} onChange={(questions) => maj({ questions })} />}

        {/* Fichiers PDF téléchargeables — disponibles pour tout type de contenu
            (ex. un cours accompagné de son support PDF, pas seulement les ressources). */}
        <div className="pt-4 mt-2 border-t border-[#ECE3D6]">
          {c.type !== 'ressource' && (
            <p className="text-xs text-ink/55 mb-2">
              Ajoutez un PDF à télécharger (support de cours, fiche…). Il apparaîtra en bas de la page pour les visiteurs.
            </p>
          )}
          <EditeurFichiers fichiers={c.fichiers ?? []} onChange={(fichiers) => maj({ fichiers })} onErreur={setErreur} />
        </div>
      </div>

      {erreur && <p className="mt-4 text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erreur}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={enregistrer} disabled={busy} className="inline-flex items-center gap-2 bg-navy text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-navy-deep disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
        </button>
        <button onClick={onAnnuler} className="text-sm text-ink/60 hover:text-navy">Annuler</button>
      </div>
    </div>
  );
};

const Label: React.FC<{ texte: string; children: React.ReactNode }> = ({ texte, children }) => (
  <label className="block">
    <span className="block text-xs font-medium text-ink/70 mb-1">{texte}</span>
    {children}
  </label>
);

// --- Éditeur de QCM -------------------------------------------------------
const EditeurQcm: React.FC<{ questions: QuestionQcm[]; onChange: (q: QuestionQcm[]) => void }> = ({ questions, onChange }) => {
  const majQ = (i: number, patch: Partial<QuestionQcm>) => onChange(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const ajouterQ = () => onChange([...questions, { enonce: '', options: [{ texte: '', correcte: true }, { texte: '', correcte: false }], explication: '' }]);
  const suppQ = (i: number) => onChange(questions.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-ink/70">Questions</p>
      {questions.map((q, i) => (
        <div key={i} className="card-soft p-4 space-y-3">
          <div className="flex items-start gap-2">
            <textarea className={champ} rows={2} placeholder={`Question ${i + 1}`} value={q.enonce} onChange={(e) => majQ(i, { enonce: e.target.value })} />
            <button onClick={() => suppQ(i)} className="p-2 text-danger hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${i}`} checked={opt.correcte} onChange={() => majQ(i, { options: q.options.map((o, k) => ({ ...o, correcte: k === oi })) })} className="accent-teal" title="Bonne réponse" />
                <input className={champ} placeholder={`Option ${oi + 1}`} value={opt.texte} onChange={(e) => majQ(i, { options: q.options.map((o, k) => (k === oi ? { ...o, texte: e.target.value } : o)) })} />
                {q.options.length > 2 && (
                  <button onClick={() => majQ(i, { options: q.options.filter((_, k) => k !== oi) })} className="p-1.5 text-ink/50 hover:text-danger"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <button onClick={() => majQ(i, { options: [...q.options, { texte: '', correcte: false }] })} className="text-xs text-teal font-semibold">+ Ajouter une option</button>
          </div>
          <input className={champ} placeholder="Explication (affichée après réponse)" value={q.explication} onChange={(e) => majQ(i, { explication: e.target.value })} />
        </div>
      ))}
      <button onClick={ajouterQ} className="inline-flex items-center gap-1.5 text-sm text-teal font-semibold"><Plus className="w-4 h-4" /> Ajouter une question</button>
    </div>
  );
};

// --- Éditeur de fichiers (ressources) -------------------------------------
const EditeurFichiers: React.FC<{
  fichiers: FichierTelechargeable[];
  onChange: (f: FichierTelechargeable[]) => void;
  onErreur: (e: string | null) => void;
}> = ({ fichiers, onChange, onErreur }) => {
  const [langue, setLangue] = useState<'fr' | 'ar'>('fr');
  const [uploadEnCours, setUploadEnCours] = useState(false);

  const gererFichier = async (file: File | undefined) => {
    if (!file) return;
    onErreur(null);
    setUploadEnCours(true);
    try {
      const label = langue === 'ar' ? 'النسخة العربية (PDF)' : 'Version française (PDF)';
      const f = await uploadFichier(file, langue, label);
      onChange([...fichiers, f]);
    } catch (e: any) {
      onErreur(e.message || 'Upload impossible.');
    } finally {
      setUploadEnCours(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ink/70">Fichiers téléchargeables</p>
      {fichiers.map((f, i) => (
        <div key={i} className="flex items-center gap-3 text-sm card-soft p-3">
          <span className="font-medium text-navy">{f.langue === 'ar' ? 'AR' : 'FR'}</span>
          <span className="flex-1 truncate text-ink/70">{f.label} {f.taille ? `· ${f.taille}` : ''}</span>
          <button onClick={() => onChange(fichiers.filter((_, j) => j !== i))} className="p-1.5 text-danger hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <select className={champ + ' w-28'} value={langue} onChange={(e) => setLangue(e.target.value as 'fr' | 'ar')}>
          <option value="fr">Français</option>
          <option value="ar">Arabe</option>
        </select>
        <label className="inline-flex items-center gap-2 bg-teal text-white font-semibold rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-[#108a80]">
          {uploadEnCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Téléverser un fichier
          <input type="file" className="hidden" disabled={uploadEnCours} onChange={(e) => gererFichier(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
};
