import React, { useState } from 'react';
import {
  FileSignature,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Printer,
  Trash2,
  Clock,
  Briefcase,
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import { Contrat, Entreprise, MotifCDD, Salarie, StatutContrat, TypeContrat } from '../../types';
import { formatMAD, formatDateJJMMAAAA } from '../../services/exportService';

interface ContractsViewProps {
  contrats: Contrat[];
  salaries: Salarie[];
  entreprise?: Entreprise;
  onSaveContrat: (c: Contrat) => void;
  onDeleteContrat?: (id: string) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  contrats,
  salaries,
  entreprise,
  onSaveContrat,
  onDeleteContrat,
  showNotification
}) => {
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');

  const [modalOuverte, setModalOuverte] = useState(false);
  const [contratEnEdition, setContratEnEdition] = useState<Partial<Contrat> | null>(null);
  const [contratAVisualiser, setContratAVisualiser] = useState<Contrat | null>(null);

  // Erreurs de validation en temps réel
  const [erreursValidation, setErreursValidation] = useState<string[]>([]);
  const [avertissementsLegaux, setAvertissementsLegaux] = useState<string[]>([]);

  // Filtrage des contrats
  const contratsFiltres = contrats.filter((c) => {
    const salarie = salaries.find((s) => s.id === c.salarieId);
    const nomComplet = salarie ? `${salarie.nom} ${salarie.prenom} ${salarie.matricule}`.toLowerCase() : '';
    const matchTexte =
      nomComplet.includes(recherche.toLowerCase()) ||
      c.numeroContrat.toLowerCase().includes(recherche.toLowerCase()) ||
      c.poste.toLowerCase().includes(recherche.toLowerCase());
    const matchType = filtreType === 'tous' || c.type === filtreType;
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
    return matchTexte && matchType && matchStatut;
  });

  // Métriques
  const totalCDI = contrats.filter((c) => c.type === 'CDI' && c.statut === 'en_cours').length;
  const totalCDD = contrats.filter((c) => c.type === 'CDD' && c.statut === 'en_cours').length;
  const totalEssai = contrats.filter((c) => {
    if (c.statut !== 'en_cours') return false;
    const dateEffet = new Date(c.dateEffet);
    const dateFinEssai = new Date(dateEffet);
    dateFinEssai.setMonth(dateFinEssai.getMonth() + (c.dureeEssaiMois || 1.5));
    return new Date() <= dateFinEssai;
  }).length;

  const handleNouveau = () => {
    const sal = salaries[0];
    const generatedNum = `CTR-CDI-${new Date().getFullYear()}-${String(contrats.length + 1).padStart(3, '0')}`;
    setContratEnEdition({
      id: `ctr-${Date.now()}`,
      salarieId: sal?.id || '',
      type: 'CDI',
      numeroContrat: generatedNum,
      dateEffet: new Date().toISOString().split('T')[0],
      dureeEssaiMois: sal?.qualification === 'Cadre' ? 3 : 1.5,
      salaireBaseMensuel: sal?.salaireBaseMensuel || 4000,
      poste: sal?.poste || 'Agent Administratif',
      statut: 'en_cours',
      clausesParticulieres: [
        'Clause de discrétion professionnelle et confidentialité',
        'Respect du règlement intérieur de l\'entreprise',
        'Obligation de loyauté et non-concurrence déloyale'
      ]
    });
    setErreursValidation([]);
    setAvertissementsLegaux([]);
    setModalOuverte(true);
  };

  const handleEditer = (c: Contrat) => {
    setContratEnEdition({ ...c });
    setErreursValidation([]);
    setAvertissementsLegaux([]);
    setModalOuverte(true);
  };

  // Validation dynamique des dates et de la légalité
  const validerContrat = (contrat: Partial<Contrat>): { valide: boolean; erreurs: string[]; avertissements: string[] } => {
    const erreurs: string[] = [];
    const avertissements: string[] = [];

    if (!contrat.salarieId) erreurs.push('Le salarié doit être obligatoirement sélectionné.');
    if (!contrat.numeroContrat || contrat.numeroContrat.trim() === '') erreurs.push('Le numéro de contrat est obligatoire.');
    if (!contrat.poste || contrat.poste.trim() === '') erreurs.push('L\'intitulé du poste est obligatoire.');
    if (!contrat.dateEffet) erreurs.push('La date d\'effet du contrat est obligatoire.');
    if (contrat.salaireBaseMensuel === undefined || contrat.salaireBaseMensuel <= 0) {
      erreurs.push('Le salaire de base mensuel doit être strictement supérieur à 0 MAD.');
    } else if (contrat.salaireBaseMensuel < 3120) {
      avertissements.push('Attention : Le salaire est inférieur au SMIG légal non agricole marocain (~3 120 MAD pour 191h).');
    }

    const salarie = salaries.find((s) => s.id === contrat.salarieId);

    // Contrôles spécifiques au CDD
    if (contrat.type === 'CDD') {
      if (!contrat.dateFinPrevue) {
        erreurs.push('Un contrat CDD exige obligatoirement une date de fin prévue (Article 16 du Code du Travail).');
      } else if (contrat.dateEffet && new Date(contrat.dateFinPrevue) <= new Date(contrat.dateEffet)) {
        erreurs.push('Incohérence de dates : la date de fin du CDD doit être strictement postérieure à la date d\'effet.');
      } else if (contrat.dateEffet && contrat.dateFinPrevue) {
        const debut = new Date(contrat.dateEffet);
        const fin = new Date(contrat.dateFinPrevue);
        const diffMois = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
        if (diffMois > 12) {
          avertissements.push('Attention (Art. 16) : La durée maximale initiale d\'un CDD au Maroc est de 1 an (renouvelable 1 fois pour un plafond de 2 ans).');
        }
      }

      if (!contrat.motifCDD) {
        erreurs.push('Le motif légal du CDD est obligatoire (Code du Travail marocain Art. 16).');
      }
      if (!contrat.justificationCDD || contrat.justificationCDD.trim() === '') {
        erreurs.push('Une justification factuelle circonstanciée du CDD doit être précisée.');
      }
    }

    // Contrôles de la période d'essai (Art. 14 du Code du Travail)
    const dureeEssai = contrat.dureeEssaiMois ?? 0;
    if (dureeEssai < 0) {
      erreurs.push('La période d\'essai ne peut pas être négative.');
    } else if (contrat.type === 'CDI') {
      const estCadre = salarie?.qualification === 'Cadre';
      const maxEssai = estCadre ? 3 : 1.5;
      if (dureeEssai > maxEssai) {
        avertissements.push(
          `Dépassement du plafond légal (Art. 14) : La période d'essai initiale maximale pour un ${estCadre ? 'Cadre est de 3 mois' : 'Employé/Agent de maîtrise est de 1,5 mois'}.`
        );
      }
    } else if (contrat.type === 'CDD' && contrat.dateEffet && contrat.dateFinPrevue) {
      const debut = new Date(contrat.dateEffet);
      const fin = new Date(contrat.dateFinPrevue);
      const diffMois = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
      const maxEssaiCDD = diffMois <= 6 ? 0.5 : 1; // 2 semaines si < 6 mois, 1 mois si > 6 mois
      if (dureeEssai > maxEssaiCDD) {
        avertissements.push(
          `Dépassement légal CDD (Art. 14) : Pour un contrat de ${diffMois} mois, la période d'essai ne peut dépasser ${maxEssaiCDD === 1 ? '1 mois' : '15 jours'}.`
        );
      }
    }

    // Contrôle des chevauchements de contrats actifs pour le même salarié
    if (contrat.salarieId && contrat.dateEffet && contrat.statut === 'en_cours') {
      const autresContratsActifs = contrats.filter(
        (c) => c.salarieId === contrat.salarieId && c.id !== contrat.id && c.statut === 'en_cours'
      );

      for (const autre of autresContratsActifs) {
        const autreDebut = new Date(autre.dateEffet);
        const autreFin = autre.dateFinPrevue ? new Date(autre.dateFinPrevue) : new Date('2099-12-31');
        const debutActuel = new Date(contrat.dateEffet);
        const finActuelle = contrat.dateFinPrevue ? new Date(contrat.dateFinPrevue) : new Date('2099-12-31');

        if (debutActuel <= autreFin && finActuelle >= autreDebut) {
          avertissements.push(
            `Chevauchement détecté : Ce salarié possède déjà un contrat actif (${autre.numeroContrat} - ${autre.type}) en vigueur depuis le ${formatDateJJMMAAAA(autre.dateEffet)}. Enregistrer ce contrat mettra à jour son contrat principal.`
          );
          break;
        }
      }
    }

    return {
      valide: erreurs.length === 0,
      erreurs,
      avertissements
    };
  };

  const handleEnregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratEnEdition) return;

    const validation = validerContrat(contratEnEdition);
    setErreursValidation(validation.erreurs);
    setAvertissementsLegaux(validation.avertissements);

    if (!validation.valide) {
      showNotification('Veuillez corriger les erreurs de validation du contrat.', 'error');
      return;
    }

    onSaveContrat(contratEnEdition as Contrat);
    setModalOuverte(false);
    setContratEnEdition(null);
  };

  const handleSupprimer = (contratId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      if (onDeleteContrat) {
        onDeleteContrat(contratId);
      } else {
        showNotification('Suppression effectuée.', 'info');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du module */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1C2459]">Gestion des Contrats de Travail</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Contrats CDI, CDD encadrés (Art. 16), avenants, périodes d'essai et association aux salariés
              </p>
            </div>
          </div>

          <button
            onClick={handleNouveau}
            className="px-4 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau contrat</span>
          </button>
        </div>

        {/* Métriques clés des contrats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-[#F4F7FA] rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Contrats</span>
            <span className="text-lg font-bold text-[#1C2459] tabular-nums">{contrats.length}</span>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
            <span className="text-[11px] text-slate-600 block">CDI en vigueur</span>
            <span className="text-lg font-bold text-[#1C2459] tabular-nums">{totalCDI}</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
            <span className="text-[11px] text-amber-800 block">CDD réglementés</span>
            <span className="text-lg font-bold text-amber-900 tabular-nums">{totalCDD}</span>
          </div>
          <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200">
            <span className="text-[11px] text-teal-800 block">Périodes d'essai actives</span>
            <span className="text-lg font-bold text-[#149D92] tabular-nums">{totalEssai}</span>
          </div>
        </div>

        {/* Recherche et Filtres */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par salarié, poste, n° contrat..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#149D92] bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Type :</span>
              <select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50"
              >
                <option value="tous">Tous types</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Avenant">Avenant</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Statut :</span>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50"
              >
                <option value="tous">Tous statuts</option>
                <option value="en_cours">En vigueur</option>
                <option value="echu">Échu</option>
                <option value="rompu">Rompu</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes des contrats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contratsFiltres.map((c) => {
          const salarie = salaries.find((s) => s.id === c.salarieId);
          const estCDD = c.type === 'CDD';

          return (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#149D92] transition-colors relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{c.numeroContrat}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        estCDD ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#1C2459]'
                      }`}
                    >
                      {c.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        c.statut === 'en_cours'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.statut === 'en_cours' ? 'Actif' : c.statut}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#1C2459]">
                  {salarie ? `${salarie.nom} ${salarie.prenom}` : 'Salarié non affecté'}
                </h3>
                <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.poste}</span>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date d'effet :</span>
                    <span className="font-medium text-slate-800 tabular-nums">{formatDateJJMMAAAA(c.dateEffet)}</span>
                  </div>

                  {estCDD && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date d'échéance :</span>
                      <span className="font-bold text-amber-700 tabular-nums">
                        {formatDateJJMMAAAA(c.dateFinPrevue)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-400">Période d'essai :</span>
                    <span className="font-medium text-slate-800">{c.dureeEssaiMois} mois</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Salaire mensuel :</span>
                    <span className="font-bold text-[#1C2459] tabular-nums">{formatMAD(c.salaireBaseMensuel)}</span>
                  </div>

                  {estCDD && c.justificationCDD && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-[11px] text-amber-900 border border-amber-200">
                      <strong>Motif Art. 16 :</strong> {c.justificationCDD}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setContratAVisualiser(c)}
                  className="text-xs text-[#149D92] hover:underline font-semibold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Voir contrat</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditer(c)}
                    className="p-1 text-slate-500 hover:text-[#1C2459] hover:bg-slate-100 rounded"
                    title="Modifier le contrat"
                  >
                    Modifier
                  </button>
                  {onDeleteContrat && (
                    <button
                      onClick={() => handleSupprimer(c.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Création & Modification de contrat */}
      {modalOuverte && contratEnEdition && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEnregistrer}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-bold text-[#1C2459]">
                  {contrats.some((c) => c.id === contratEnEdition.id) ? 'Modifier le contrat' : 'Établir un nouveau contrat de travail'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  L'enregistrement synchronisera automatiquement le profil du salarié associé
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Alertes et erreurs de validation */}
              {erreursValidation.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    <span>Erreurs de validation obligatoires :</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {erreursValidation.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {avertissementsLegaux.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-4 h-4 text-amber-700" />
                    <span>Avertissements de conformité légale (Code du Travail) :</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {avertissementsLegaux.map((av, i) => (
                      <li key={i}>{av}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sélection du salarié */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Salarié associé <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={contratEnEdition.salarieId || ''}
                  onChange={(e) => {
                    const sal = salaries.find((s) => s.id === e.target.value);
                    const isCadre = sal?.qualification === 'Cadre';
                    setContratEnEdition({
                      ...contratEnEdition,
                      salarieId: e.target.value,
                      poste: sal?.poste || contratEnEdition.poste,
                      salaireBaseMensuel: sal?.salaireBaseMensuel || contratEnEdition.salaireBaseMensuel,
                      dureeEssaiMois: isCadre ? 3 : 1.5
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-semibold text-[#1C2459]"
                >
                  {salaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.matricule} - {s.nom} {s.prenom} ({s.qualification} · {s.poste})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type, Numéro et Statut */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Type de contrat <span className="text-red-500">*</span></label>
                  <select
                    value={contratEnEdition.type || 'CDI'}
                    onChange={(e) => {
                      const t = e.target.value as TypeContrat;
                      const nextNum = `CTR-${t}-${new Date().getFullYear()}-${String(contrats.length + 1).padStart(3, '0')}`;
                      setContratEnEdition({
                        ...contratEnEdition,
                        type: t,
                        numeroContrat: nextNum,
                        motifCDD: t === 'CDD' ? 'remplacement_provisoire' : undefined
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-bold"
                  >
                    <option value="CDI">CDI (Droit commun)</option>
                    <option value="CDD">CDD (Dérogatoire Art. 16)</option>
                    <option value="Avenant">Avenant modificatif</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Numéro de contrat <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={contratEnEdition.numeroContrat || ''}
                    onChange={(e) => setContratEnEdition({ ...contratEnEdition, numeroContrat: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Statut du contrat</label>
                  <select
                    value={contratEnEdition.statut || 'en_cours'}
                    onChange={(e) => setContratEnEdition({ ...contratEnEdition, statut: e.target.value as StatutContrat })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="en_cours">En vigueur (Actif)</option>
                    <option value="echu">Échu (Terminé)</option>
                    <option value="rompu">Rompu</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                </div>
              </div>

              {/* Poste et Salaire de base */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Intitulé du poste <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={contratEnEdition.poste || ''}
                    onChange={(e) => setContratEnEdition({ ...contratEnEdition, poste: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Salaire de base mensuel (MAD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={contratEnEdition.salaireBaseMensuel || 4000}
                    onChange={(e) =>
                      setContratEnEdition({ ...contratEnEdition, salaireBaseMensuel: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold text-[#1C2459]"
                  />
                  <span className="text-[10px] text-slate-500">Pour 191h moyennes mensuelles (Art. 184)</span>
                </div>
              </div>

              {/* Dates et Période d'essai */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date d'effet (Début) <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={contratEnEdition.dateEffet || ''}
                    onChange={(e) => setContratEnEdition({ ...contratEnEdition, dateEffet: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Date de fin prévue {contratEnEdition.type === 'CDD' && <span className="text-red-500">* (CDD)</span>}
                  </label>
                  <input
                    type="date"
                    disabled={contratEnEdition.type !== 'CDD'}
                    required={contratEnEdition.type === 'CDD'}
                    value={contratEnEdition.dateFinPrevue || ''}
                    onChange={(e) => setContratEnEdition({ ...contratEnEdition, dateFinPrevue: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Période d'essai (mois)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="6"
                    value={contratEnEdition.dureeEssaiMois ?? 1.5}
                    onChange={(e) => setContratEnEdition({ ...contratEnEdition, dureeEssaiMois: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                  <span className="text-[10px] text-slate-500">Art. 14 : Cadre max 3m / Employé max 1.5m</span>
                </div>
              </div>

              {/* Bloc spécial CDD */}
              {contratEnEdition.type === 'CDD' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Encadrement obligatoire du CDD (Article 16 Code du Travail)</span>
                  </div>

                  <div>
                    <label className="block font-medium text-amber-950 mb-1">Motif légal d'ouverture du CDD <span className="text-red-500">*</span></label>
                    <select
                      value={contratEnEdition.motifCDD || 'remplacement_provisoire'}
                      onChange={(e) => setContratEnEdition({ ...contratEnEdition, motifCDD: e.target.value as MotifCDD })}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded bg-white text-xs"
                    >
                      <option value="remplacement_provisoire">Remplacement d'un salarié dont le contrat est suspendu (maladie, maternité)</option>
                      <option value="accroissement_temporaire">Surcroît exceptionnel et temporaire d'activité de l'entreprise</option>
                      <option value="travail_saisonnier">Emploi à caractère saisonnier</option>
                      <option value="ouverture_etablissement">Lancement d'une nouvelle entreprise ou nouvel établissement (max 1 an)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-amber-950 mb-1">Justification concrète de la situation <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Remplacement congé maternité de Mme Salma BERRADA"
                      value={contratEnEdition.justificationCDD || ''}
                      onChange={(e) => setContratEnEdition({ ...contratEnEdition, justificationCDD: e.target.value })}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Clauses contractuelles */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Clauses contractuelles incluses</label>
                <div className="space-y-1.5 bg-[#F4F7FA] p-3 rounded-lg border border-slate-200 text-[11px]">
                  {[
                    'Clause de discrétion professionnelle et confidentialité',
                    'Respect du règlement intérieur de l\'entreprise',
                    'Obligation de loyauté et non-concurrence déloyale',
                    'Période d\'essai renouvelable une seule fois selon la loi',
                    'Affiliation obligatoire aux régimes de sécurité sociale (CNSS & AMO)'
                  ].map((clause, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contratEnEdition.clausesParticulieres?.includes(clause) ?? true}
                        onChange={(e) => {
                          const existantes = contratEnEdition.clausesParticulieres || [];
                          if (e.target.checked) {
                            setContratEnEdition({ ...contratEnEdition, clausesParticulieres: [...existantes, clause] });
                          } else {
                            setContratEnEdition({
                              ...contratEnEdition,
                              clausesParticulieres: existantes.filter((c) => c !== clause)
                            });
                          }
                        }}
                        className="rounded text-[#149D92]"
                      />
                      <span className="text-slate-700">{clause}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 sticky bottom-0">
              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#149D92] text-white rounded-lg hover:bg-[#11857c] shadow-sm"
              >
                Enregistrer le contrat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Visualisation complète du contrat imprimable format A4 */}
      {contratAVisualiser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10 no-print">
              <div>
                <h3 className="text-sm font-bold text-[#1C2459]">
                  Contrat de travail : {contratAVisualiser.numeroContrat}
                </h3>
                <span className="text-xs text-slate-500">Format A4 conforme au Code du Travail marocain (Loi 65-99)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#1C2459] text-white rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer A4</span>
                </button>
                <button
                  onClick={() => setContratAVisualiser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corps du contrat */}
            <div className="p-8 text-xs text-slate-800 space-y-5 leading-relaxed font-sans">
              <div className="text-center border-b-2 border-[#1C2459] pb-4">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1C2459]">
                  CONTRAT DE TRAVAIL {contratAVisualiser.type === 'CDD' ? 'À DURÉE DÉTERMINÉE (CDD)' : 'À DURÉE INDÉTERMINÉE (CDI)'}
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-1">N° {contratAVisualiser.numeroContrat}</div>
                <div className="text-[10px] text-slate-400 italic mt-1">
                  Simulation pédagogique — données fictives — ne vaut pas validation juridique.
                </div>
              </div>

              {/* Les parties */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#1C2459] uppercase border-b pb-1">ENTRE LES SOUSSIGNÉS :</h4>
                <p>
                  <strong>La société {entreprise?.raisonSociale || 'Atlas Services Formation SARL'}</strong>, {entreprise?.formeJuridique || 'SARL'}, au capital de 100 000 MAD, dont le siège social est situé à {entreprise?.siegeSocial || '142 Boulevard Mohammed V, Guéliz, Marrakech'}, immatriculée au Registre du Commerce sous le N° {entreprise?.registreCommerce || 'RC-48920'}, affiliée à la CNSS sous le N° {entreprise?.numeroCNSS || '7845129'}, et titulaire de l'ICE N° {entreprise?.ice || '001894235000084'}, représentée par <strong>{entreprise?.representantLegal || 'M. Karim EL AMRANI'}</strong>, en qualité de Gérant,
                  <br />
                  <span className="italic block mt-1">Ci-après dénommée « L'Employeur », d'une part,</span>
                </p>

                {(() => {
                  const sal = salaries.find((s) => s.id === contratAVisualiser.salarieId);
                  return (
                    <p>
                      <strong>ET :</strong><br />
                      <strong>M. / Mme {sal?.nom} {sal?.prenom}</strong>, né(e) le {formatDateJJMMAAAA(sal?.dateNaissance)} à {sal?.lieuNaissance}, de nationalité {sal?.nationalite}, titulaire de la CIN (fictive) N° <strong>{sal?.cinFictif}</strong>, immatriculé(e) à la CNSS sous le N° <strong>{sal?.cnssFictif}</strong>, demeurant à {sal?.adresseFictive || sal?.ville},
                      <br />
                      <span className="italic block mt-1">Ci-après dénommé(e) « Le Salarié », d'autre part.</span>
                    </p>
                  );
                })()}
              </div>

              {/* Articles du contrat */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[#1C2459] uppercase border-b pb-1">IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</h4>

                <div>
                  <strong className="text-slate-900 block">Article 1 : Engagement et Nature du Contrat</strong>
                  <p>
                    L'Employeur engage le Salarié sous contrat de travail à durée {contratAVisualiser.type === 'CDD' ? 'déterminée (CDD)' : 'indéterminée (CDI)'}, régi par les dispositions du Code du Travail marocain (Loi n° 65-99).
                    {contratAVisualiser.type === 'CDD' && (
                      <span className="block mt-1 p-2 bg-amber-50 border border-amber-200 rounded font-semibold text-amber-900">
                        Motif légal justifiant le recours au CDD (Art. 16) : {contratAVisualiser.justificationCDD}.
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block">Article 2 : Fonctions et Qualification</strong>
                  <p>
                    Le Salarié exercera les fonctions de <strong>{contratAVisualiser.poste}</strong>. Il s'engage à consacrer l'intégralité de son activité professionnelle aux tâches qui lui seront confiées par la direction.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block">Article 3 : Date d'effet, Durée et Période d'Essai</strong>
                  <p>
                    Le contrat prend effet à compter du <strong>{formatDateJJMMAAAA(contratAVisualiser.dateEffet)}</strong>.
                    {contratAVisualiser.type === 'CDD' ? (
                      <span> Le contrat prendra fin de plein droit le <strong>{formatDateJJMMAAAA(contratAVisualiser.dateFinPrevue)}</strong>, sans préavis ni indemnité de fin de contrat.</span>
                    ) : (
                      <span> Le présent contrat est conclu pour une durée indéterminée.</span>
                    )}
                    <br />
                    Conformément à l'Article 14 du Code du Travail, le présent engagement est soumis à une période d'essai initiale de <strong>{contratAVisualiser.dureeEssaiMois} mois</strong> de travail effectif, durant laquelle chacune des parties pourra rompre le contrat sans préavis ni indemnité.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block">Article 4 : Durée du Travail</strong>
                  <p>
                    La durée du travail est fixée à <strong>44 heures par semaine</strong>, soit une moyenne mensuelle de <strong>191 heures</strong> (Article 184 du Code du Travail pour les activités non agricoles).
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block">Article 5 : Rémunération</strong>
                  <p>
                    En contrepartie de ses prestations, le Salarié percevra un salaire mensuel de base brut de <strong>{formatMAD(contratAVisualiser.salaireBaseMensuel)}</strong>, sous déduction des cotisations sociales légales obligatoires (CNSS, AMO) et de l'Impôt sur le Revenu (IR) précompté à la source.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block">Article 6 : Congés Annuels Payés</strong>
                  <p>
                    Le Salarié bénéficiera des congés payés annuels à raison de 1,5 jour ouvrable par mois de travail effectif (soit 18 jours ouvrables par an), conformément aux Articles 231 et suivants du Code du Travail.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block">Article 7 : Clauses Particulières</strong>
                  <ul className="list-disc pl-5 space-y-1">
                    {(contratAVisualiser.clausesParticulieres || []).map((cl, i) => (
                      <li key={i}>{cl}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                <div>
                  <strong className="block text-slate-800">Pour l'Employeur</strong>
                  <span className="text-[11px] text-slate-400 block">{entreprise?.representantLegal || 'M. Karim EL AMRANI'}</span>
                  <div className="h-16 border-b border-dashed border-slate-300 mt-2 flex items-center justify-center text-[10px] text-slate-400">
                    Cachet et signature
                  </div>
                </div>

                <div>
                  <strong className="block text-slate-800">Le Salarié</strong>
                  <span className="text-[10px] text-slate-400 block">(Précédé de la mention manuscrite « Lu et approuvé »)</span>
                  <div className="h-16 border-b border-dashed border-slate-300 mt-2 flex items-center justify-center text-[10px] text-slate-400">
                    Signature du salarié
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
