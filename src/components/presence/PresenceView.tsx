import React, { useState } from 'react';
import {
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  ListFilter,
  Grid
} from 'lucide-react';
import { EvenementPresence, Salarie, StatutWorkflow, TypeEvenementPresence } from '../../types';
import { formatMAD, formatDateJJMMAAAA } from '../../services/exportService';

interface PresenceViewProps {
  evenements: EvenementPresence[];
  salaries: Salarie[];
  periodeActive: string;
  onSaveEvenement: (evt: EvenementPresence) => void;
  onDeleteEvenement?: (id: string) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PresenceView: React.FC<PresenceViewProps> = ({
  evenements,
  salaries,
  periodeActive,
  onSaveEvenement,
  onDeleteEvenement,
  showNotification
}) => {
  const [vueMode, setVueMode] = useState<'liste' | 'calendrier'>('liste');
  const [modalOuverte, setModalOuverte] = useState(false);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [salarieFiltre, setSalarieFiltre] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');

  const [evenementEnEdition, setEvenementEnEdition] = useState<Partial<EvenementPresence> | null>(null);

  // Filtrage des événements de la période active
  const evenementsMois = evenements.filter((e) => {
    const matchMois = e.periodeMois === periodeActive || e.dateDebut.startsWith(periodeActive);
    const matchType = filtreType === 'tous' || e.type === filtreType;
    const matchSal = salarieFiltre === 'tous' || e.salarieId === salarieFiltre;

    const sal = salaries.find((s) => s.id === e.salarieId);
    const nomSal = sal ? `${sal.nom} ${sal.prenom} ${sal.matricule}`.toLowerCase() : '';
    const matchTexte = nomSal.includes(recherche.toLowerCase()) || e.motif.toLowerCase().includes(recherche.toLowerCase());

    return matchMois && matchType && matchSal && matchTexte;
  });

  // Métriques de pointage du mois
  const totalHeuresSup = evenementsMois
    .filter((e) => e.type.startsWith('heures_sup') && e.statut === 'Approuvee')
    .reduce((sum, e) => sum + e.duree, 0);

  const totalAbsencesInjustifiees = evenementsMois
    .filter((e) => e.type === 'absence_injustifiee' && e.statut === 'Approuvee')
    .reduce((sum, e) => sum + (e.unite === 'jours' ? e.duree * 8 : e.duree), 0);

  const totalMaladieJours = evenementsMois
    .filter((e) => e.type === 'arret_maladie' && e.statut === 'Approuvee')
    .reduce((sum, e) => sum + (e.unite === 'jours' ? e.duree : e.duree / 8), 0);

  const totalCongesJours = evenementsMois
    .filter((e) => (e.type === 'conge_annuel' || e.type === 'conge_exceptionnel') && e.statut === 'Approuvee')
    .reduce((sum, e) => sum + (e.unite === 'jours' ? e.duree : e.duree / 8), 0);

  // Nombre de jours dans le mois actif
  const [anneeStr, moisStr] = periodeActive.split('-');
  const annee = Number(anneeStr);
  const mois = Number(moisStr);
  const nombreJoursMois = new Date(annee, mois, 0).getDate();
  const joursDuMois = Array.from({ length: nombreJoursMois }, (_, i) => i + 1);

  const handleNouveau = (salarieIdPreselect?: string, datePreselect?: string) => {
    const salId = salarieIdPreselect || salaries[0]?.id || '';
    const dateJour = datePreselect || `${periodeActive}-15`;

    setEvenementEnEdition({
      id: `evt-${Date.now()}`,
      salarieId: salId,
      periodeMois: periodeActive,
      type: 'heures_sup_jour_25',
      dateDebut: dateJour,
      dateFin: dateJour,
      duree: 4,
      unite: 'heures',
      motif: 'Surcroît temporaire d\'activité professionnelle',
      justificatifFictif: 'Fiche d\'approbation responsable de département',
      statut: 'Approuvee',
      impactPaie: true,
      regleAppliquee: 'Code du Travail marocain Art. 197 : Majoration légale de 25% (6h à 21h en jour ouvrable)'
    });
    setModalOuverte(true);
  };

  const handleEditer = (evt: EvenementPresence) => {
    setEvenementEnEdition({ ...evt });
    setModalOuverte(true);
  };

  const handleEnregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evenementEnEdition || !evenementEnEdition.salarieId) {
      showNotification('Veuillez sélectionner un salarié.', 'error');
      return;
    }

    if (!evenementEnEdition.dateDebut) {
      showNotification('La date de début est obligatoire.', 'error');
      return;
    }

    if (evenementEnEdition.dateFin && new Date(evenementEnEdition.dateFin) < new Date(evenementEnEdition.dateDebut)) {
      showNotification('La date de fin ne peut pas être antérieure à la date de début.', 'error');
      return;
    }

    if (!evenementEnEdition.duree || evenementEnEdition.duree <= 0) {
      showNotification('La durée doit être strictement supérieure à 0.', 'error');
      return;
    }

    onSaveEvenement(evenementEnEdition as EvenementPresence);
    setModalOuverte(false);
    setEvenementEnEdition(null);
  };

  const handleSupprimer = (evtId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement de pointage ?')) {
      if (onDeleteEvenement) {
        onDeleteEvenement(evtId);
      } else {
        showNotification('Suppression effectuée.', 'info');
      }
    }
  };

  // Helper pour estimer l'impact financier en MAD
  const calculerImpactFinancier = (evt: Partial<EvenementPresence>): { montant: number; sens: 'gain' | 'retenue' | 'neutre'; texte: string } => {
    const sal = salaries.find((s) => s.id === evt.salarieId);
    if (!sal) return { montant: 0, sens: 'neutre', texte: '-' };

    const tauxHoraire = sal.salaireBaseMensuel / 191;
    const heures = evt.unite === 'jours' ? (evt.duree || 0) * 8 : (evt.duree || 0);

    if (evt.type === 'heures_sup_jour_25') {
      const val = heures * tauxHoraire * 1.25;
      return { montant: val, sens: 'gain', texte: `+${formatMAD(val)} sur salaire brut (+25%)` };
    }
    if (evt.type === 'heures_sup_nuit_50' || evt.type === 'heures_sup_repos_jour_50') {
      const val = heures * tauxHoraire * 1.50;
      return { montant: val, sens: 'gain', texte: `+${formatMAD(val)} sur salaire brut (+50%)` };
    }
    if (evt.type === 'heures_sup_repos_nuit_100') {
      const val = heures * tauxHoraire * 2.00;
      return { montant: val, sens: 'gain', texte: `+${formatMAD(val)} sur salaire brut (+100%)` };
    }
    if (evt.type === 'absence_injustifiee' || evt.type === 'retard') {
      const val = heures * tauxHoraire;
      return { montant: val, sens: 'retenue', texte: `-${formatMAD(val)} retenue proportionnelle` };
    }
    if (evt.type === 'arret_maladie') {
      const val = heures * tauxHoraire;
      return { montant: val, sens: 'retenue', texte: `-${formatMAD(val)} retenue temps non travaillé (carence 3j CNSS)` };
    }

    return { montant: 0, sens: 'neutre', texte: 'Rémunération maintenue sans retenue' };
  };

  const getLibelleType = (type: TypeEvenementPresence) => {
    switch (type) {
      case 'heures_sup_jour_25':
        return 'Heures Sup. Jour (+25%)';
      case 'heures_sup_nuit_50':
        return 'Heures Sup. Nuit (+50%)';
      case 'heures_sup_repos_jour_50':
        return 'Heures Sup. Repos/Férié Jour (+50%)';
      case 'heures_sup_repos_nuit_100':
        return 'Heures Sup. Repos/Férié Nuit (+100%)';
      case 'absence_injustifiee':
        return 'Absence injustifiée (Retenue)';
      case 'absence_justifiee':
        return 'Absence justifiée';
      case 'arret_maladie':
        return 'Arrêt maladie';
      case 'retard':
        return 'Retard';
      case 'conge_annuel':
        return 'Congé annuel payé (Art. 231)';
      case 'conge_exceptionnel':
        return 'Congé exceptionnel (Art. 269/274)';
      case 'maternite':
        return 'Congé de maternité';
      default:
        return type;
    }
  };

  const getBadgeClass = (type: TypeEvenementPresence) => {
    if (type.startsWith('heures_sup')) return 'bg-teal-50 text-[#149D92] border-teal-200';
    if (type === 'absence_injustifiee') return 'bg-red-50 text-red-700 border-red-200';
    if (type === 'arret_maladie') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (type === 'conge_annuel') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (type === 'conge_exceptionnel') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getAbreviationCalendrier = (type: TypeEvenementPresence) => {
    switch (type) {
      case 'heures_sup_jour_25':
        return 'H25';
      case 'heures_sup_nuit_50':
        return 'H50';
      case 'heures_sup_repos_jour_50':
        return 'H50';
      case 'heures_sup_repos_nuit_100':
        return 'H100';
      case 'absence_injustifiee':
        return 'AI';
      case 'absence_justifiee':
        return 'AJ';
      case 'arret_maladie':
        return 'AM';
      case 'conge_annuel':
        return 'CA';
      case 'conge_exceptionnel':
        return 'CE';
      case 'retard':
        return 'R';
      default:
        return 'P';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête principal */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1C2459]">Suivi des Présences &amp; Absences</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Période active : <strong>{periodeActive}</strong> · Pointage journalier et horaire avec détection automatique de l'impact paie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bascule Vue Liste vs Vue Calendrier */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setVueMode('liste')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  vueMode === 'liste' ? 'bg-white text-[#1C2459] shadow-xs' : 'text-slate-600'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Vue Liste</span>
              </button>
              <button
                onClick={() => setVueMode('calendrier')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  vueMode === 'calendrier' ? 'bg-white text-[#149D92] shadow-xs' : 'text-slate-600'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grille Mensuelle</span>
              </button>
            </div>

            <button
              onClick={() => handleNouveau()}
              className="px-4 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer pointage</span>
            </button>
          </div>
        </div>

        {/* Métriques mensuelles */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200">
            <span className="text-[11px] text-teal-800 block">Heures supplémentaires</span>
            <span className="text-lg font-bold text-[#149D92] tabular-nums">
              {totalHeuresSup} h
            </span>
            <span className="text-[10px] text-slate-500 block">Majorées à 25%, 50% ou 100%</span>
          </div>

          <div className="p-3 bg-red-50/60 rounded-lg border border-red-200">
            <span className="text-[11px] text-red-800 block">Absences injustifiées</span>
            <span className="text-lg font-bold text-red-700 tabular-nums">
              {totalAbsencesInjustifiees} h
            </span>
            <span className="text-[10px] text-slate-500 block">Déduites du salaire brut</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
            <span className="text-[11px] text-amber-800 block">Arrêts maladie</span>
            <span className="text-lg font-bold text-amber-900 tabular-nums">
              {totalMaladieJours} jour(s)
            </span>
            <span className="text-[10px] text-slate-500 block">Carence 3 jours CNSS</span>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
            <span className="text-[11px] text-blue-800 block">Congés pris</span>
            <span className="text-lg font-bold text-[#1C2459] tabular-nums">
              {totalCongesJours} jour(s)
            </span>
            <span className="text-[10px] text-slate-500 block">Annuels &amp; exceptionnels payés</span>
          </div>
        </div>

        {/* Filtres de recherche */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par salarié, motif, matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#149D92] bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Salarié :</span>
              <select
                value={salarieFiltre}
                onChange={(e) => setSalarieFiltre(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50"
              >
                <option value="tous">Tous les salariés</option>
                {salaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.matricule} - {s.nom} {s.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Nature :</span>
              <select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50"
              >
                <option value="tous">Toutes natures</option>
                <option value="heures_sup_jour_25">Heures Sup. 25%</option>
                <option value="heures_sup_nuit_50">Heures Sup. 50%</option>
                <option value="absence_injustifiee">Absence injustifiée</option>
                <option value="arret_maladie">Arrêt maladie</option>
                <option value="conge_annuel">Congé annuel payé</option>
                <option value="conge_exceptionnel">Congé exceptionnel</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* VUE 1 : GRILLE MENSUELLE / CALENDRIER DE POINTAGE */}
      {vueMode === 'calendrier' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1C2459] uppercase tracking-wider block">
                Calendrier Mensuel de Pointage — {periodeActive}
              </span>
              <span className="text-[11px] text-slate-500">
                Cliquez sur une case pour ajouter ou modifier un événement de pointage sur ce jour
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-teal-500"></span> Heures Sup (H)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-500"></span> Absence Injustifiée (AI)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Maladie (AM)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Congé (CA/CE)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#1C2459] text-white">
                  <th className="py-2 px-3 text-left min-w-36 sticky left-0 bg-[#1C2459] z-10">Collaborateur</th>
                  {joursDuMois.map((jour) => {
                    const dateStr = `${periodeActive}-${String(jour).padStart(2, '0')}`;
                    const dateObj = new Date(dateStr);
                    const estDimanche = dateObj.getDay() === 0;

                    return (
                      <th
                        key={jour}
                        className={`py-2 px-1 min-w-7 border-l border-slate-700 font-mono ${
                          estDimanche ? 'bg-[#11273e] text-amber-300 font-bold' : ''
                        }`}
                      >
                        {jour}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((sal) => {
                  const evtsSal = evenements.filter((e) => e.salarieId === sal.id && (e.periodeMois === periodeActive || e.dateDebut.startsWith(periodeActive)));

                  return (
                    <tr key={sal.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                        <div className="text-xs truncate">{sal.nom} {sal.prenom}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sal.matricule}</div>
                      </td>

                      {joursDuMois.map((jour) => {
                        const dateStr = `${periodeActive}-${String(jour).padStart(2, '0')}`;
                        const dateObj = new Date(dateStr);
                        const estDimanche = dateObj.getDay() === 0;

                        // Trouver l'événement sur cette date
                        const evtJour = evtsSal.find((e) => {
                          const deb = new Date(e.dateDebut);
                          const fin = new Date(e.dateFin || e.dateDebut);
                          const courant = new Date(dateStr);
                          return courant >= deb && courant <= fin;
                        });

                        return (
                          <td
                            key={jour}
                            onClick={() => {
                              if (evtJour) {
                                handleEditer(evtJour);
                              } else {
                                handleNouveau(sal.id, dateStr);
                              }
                            }}
                            className={`py-1.5 px-0.5 border-l border-slate-100 cursor-pointer transition-colors ${
                              estDimanche ? 'bg-slate-100/60' : 'hover:bg-teal-50/50'
                            }`}
                            title={
                              evtJour
                                ? `${evtJour.motif} (${evtJour.duree} ${evtJour.unite})`
                                : `Ajouter un pointage le ${dateStr}`
                            }
                          >
                            {evtJour ? (
                              <span
                                className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                  evtJour.type
                                )}`}
                              >
                                {getAbreviationCalendrier(evtJour.type)}
                              </span>
                            ) : estDimanche ? (
                              <span className="text-slate-300 font-mono">D</span>
                            ) : (
                              <span className="text-slate-200">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE 2 : LISTE DÉTAILLÉE DES ÉVÉNEMENTS */}
      {vueMode === 'liste' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#1C2459] uppercase tracking-wider">
              Registre des événements enregistrés ({evenementsMois.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Période : {periodeActive} · Stockage local IndexedDB
            </span>
          </div>

          {evenementsMois.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Aucun événement de pointage saisi pour cette période. Cliquez sur « Enregistrer pointage » pour en créer un.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {evenementsMois.map((evt) => {
                const sal = salaries.find((s) => s.id === evt.salarieId);
                const impact = calculerImpactFinancier(evt);

                return (
                  <div
                    key={evt.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getBadgeClass(evt.type)}`}>
                          {getLibelleType(evt.type)}
                        </span>
                        <span className="font-bold text-slate-900">
                          {sal ? `${sal.nom} ${sal.prenom}` : 'Salarié non affecté'}
                        </span>
                        <span className="text-slate-400 font-mono">({sal?.matricule})</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-700 tabular-nums">
                          {formatDateJJMMAAAA(evt.dateDebut)}
                          {evt.dateFin !== evt.dateDebut && ` au ${formatDateJJMMAAAA(evt.dateFin)}`}
                        </span>
                      </div>

                      <div className="text-slate-700">
                        <strong>Motif :</strong> {evt.motif}
                        {evt.justificatifFictif && (
                          <span className="text-slate-500 text-[11px] ml-2 italic">
                            (Justificatif : {evt.justificatifFictif})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Règle légale : {evt.regleAppliquee}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 self-end md:self-center shrink-0">
                      {/* Durée & Impact sur la paie */}
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#1C2459] block tabular-nums">
                          {evt.duree} {evt.unite}
                        </span>
                        <span
                          className={`text-[11px] font-semibold block ${
                            impact.sens === 'gain'
                              ? 'text-[#149D92]'
                              : impact.sens === 'retenue'
                              ? 'text-red-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {impact.texte}
                        </span>
                      </div>

                      {/* Statut du workflow */}
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                          evt.statut === 'Approuvee'
                            ? 'bg-emerald-50 text-emerald-700'
                            : evt.statut === 'Refusee'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {evt.statut === 'Approuvee' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {evt.statut}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                        <button
                          onClick={() => handleEditer(evt)}
                          className="p-1 text-slate-500 hover:text-[#1C2459] hover:bg-slate-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {onDeleteEvenement && (
                          <button
                            onClick={() => handleSupprimer(evt.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Saisie / Édition d'Événement */}
      {modalOuverte && evenementEnEdition && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEnregistrer}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-bold text-[#1C2459]">
                  {evenements.some((e) => e.id === evenementEnEdition.id) ? 'Modifier le pointage' : 'Enregistrer un événement de pointage'}
                </h3>
                <p className="text-[11px] text-slate-500">Période de paie liée : {evenementEnEdition.periodeMois || periodeActive}</p>
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
              {/* Salarié */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Salarié concerné <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={evenementEnEdition.salarieId || ''}
                  onChange={(e) => setEvenementEnEdition({ ...evenementEnEdition, salarieId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-semibold text-[#1C2459]"
                >
                  {salaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.matricule} - {s.nom} {s.prenom} ({s.poste} · {formatMAD(s.salaireBaseMensuel)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type d'événement */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nature de l'événement <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={evenementEnEdition.type || 'heures_sup_jour_25'}
                  onChange={(e) => {
                    const t = e.target.value as TypeEvenementPresence;
                    let regle = 'Code du Travail';
                    let unite: 'heures' | 'jours' = 'heures';
                    let impact = true;

                    if (t === 'heures_sup_jour_25') regle = 'Art. 197 : Majoration légale de 25% (6h-21h en jour ouvrable)';
                    if (t === 'heures_sup_nuit_50') regle = 'Art. 197 : Majoration légale de 50% de nuit (21h-6h)';
                    if (t === 'heures_sup_repos_jour_50') regle = 'Art. 200 : Majoration de 50% le jour de repos ou férié';
                    if (t === 'heures_sup_repos_nuit_100') regle = 'Art. 200 : Majoration de 100% la nuit d\'un jour de repos ou férié';
                    if (t === 'absence_injustifiee') regle = 'Art. 184 : Retenue stricte proportionnelle (Salaire Base / 191h)';
                    if (t === 'absence_justifiee') {
                      regle = 'Absence autorisée sans solde';
                      impact = false;
                    }
                    if (t === 'arret_maladie') {
                      regle = 'Art. 271 : Retenue employeur et indemnités CNSS après 3 jours de carence';
                      unite = 'jours';
                      impact = true;
                    }
                    if (t === 'conge_annuel') {
                      regle = 'Art. 231 : Droit à congé payé (1,5 j/mois), rémunération maintenue';
                      unite = 'jours';
                      impact = false;
                    }
                    if (t === 'conge_exceptionnel') {
                      regle = 'Art. 269/274 : Événement familial légal rémunéré sans retenue';
                      unite = 'jours';
                      impact = false;
                    }
                    if (t === 'retard') {
                      regle = 'Retard ponctuel déductible';
                      unite = 'heures';
                      impact = true;
                    }

                    setEvenementEnEdition({
                      ...evenementEnEdition,
                      type: t,
                      unite,
                      regleAppliquee: regle,
                      impactPaie: impact
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900"
                >
                  <optgroup label="Heures supplémentaires réglementées">
                    <option value="heures_sup_jour_25">Heures Sup. Jour Ouvrable (+25%)</option>
                    <option value="heures_sup_nuit_50">Heures Sup. Nuit Ouvrable (+50%)</option>
                    <option value="heures_sup_repos_jour_50">Heures Sup. Repos / Férié Jour (+50%)</option>
                    <option value="heures_sup_repos_nuit_100">Heures Sup. Repos / Férié Nuit (+100%)</option>
                  </optgroup>
                  <optgroup label="Absences &amp; Retards">
                    <option value="absence_injustifiee">Absence Injustifiée (Retenue salaire)</option>
                    <option value="absence_justifiee">Absence Justifiée (Sans solde)</option>
                    <option value="retard">Retard de pointage</option>
                  </optgroup>
                  <optgroup label="Congés &amp; Maladies">
                    <option value="arret_maladie">Arrêt Maladie (Certificat médical)</option>
                    <option value="conge_annuel">Congé Annuel Payé (Art. 231)</option>
                    <option value="conge_exceptionnel">Congé Exceptionnel Rémunéré (Art. 274)</option>
                    <option value="maternite">Congé de Maternité</option>
                  </optgroup>
                </select>
              </div>

              {/* Dates et Durée */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">Date début <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={evenementEnEdition.dateDebut || ''}
                    onChange={(e) => {
                      const deb = e.target.value;
                      setEvenementEnEdition({
                        ...evenementEnEdition,
                        dateDebut: deb,
                        dateFin: evenementEnEdition.dateFin && evenementEnEdition.dateFin < deb ? deb : (evenementEnEdition.dateFin || deb)
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-semibold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    required
                    value={evenementEnEdition.dateFin || evenementEnEdition.dateDebut || ''}
                    onChange={(e) => setEvenementEnEdition({ ...evenementEnEdition, dateFin: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Durée <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={evenementEnEdition.duree || 0}
                    onChange={(e) => setEvenementEnEdition({ ...evenementEnEdition, duree: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unité</label>
                  <select
                    value={evenementEnEdition.unite || 'heures'}
                    onChange={(e) =>
                      setEvenementEnEdition({ ...evenementEnEdition, unite: e.target.value as 'heures' | 'jours' })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-semibold"
                  >
                    <option value="heures">Heures</option>
                    <option value="jours">Jours</option>
                  </select>
                </div>
              </div>

              {/* Estimation financière en direct */}
              {(() => {
                const impact = calculerImpactFinancier(evenementEnEdition);
                return (
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                      impact.sens === 'gain'
                        ? 'bg-teal-50 border-teal-200 text-teal-900'
                        : impact.sens === 'retenue'
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <div>
                        <strong>Incidence calculée sur le salaire :</strong>
                        <div className="text-[11px]">{impact.texte}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-sm">
                      {impact.montant > 0 && formatMAD(impact.montant)}
                    </div>
                  </div>
                );
              })()}

              {/* Motif et Justificatif */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Motif / Justification circonstanciée <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Surcroît temporaire préparation examens, panne de véhicule..."
                  value={evenementEnEdition.motif || ''}
                  onChange={(e) => setEvenementEnEdition({ ...evenementEnEdition, motif: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Justificatif fourni (Document / Réf fictive)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Certificat médical délivré le 05/02/2025, bulletin de retard..."
                  value={evenementEnEdition.justificatifFictif || ''}
                  onChange={(e) => setEvenementEnEdition({ ...evenementEnEdition, justificatifFictif: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                />
              </div>

              {/* Circuit et Règle appliquée */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Statut du circuit d'approbation</label>
                  <select
                    value={evenementEnEdition.statut || 'Approuvee'}
                    onChange={(e) =>
                      setEvenementEnEdition({ ...evenementEnEdition, statut: e.target.value as StatutWorkflow })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                  >
                    <option value="Brouillon">Brouillon (Non validé)</option>
                    <option value="Soumise">Soumise pour validation</option>
                    <option value="Approuvee">Approuvée (Prise en compte en paie)</option>
                    <option value="Refusee">Refusée</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Impact direct sur la paie</label>
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chkImpactPaieModal"
                      checked={evenementEnEdition.impactPaie ?? true}
                      onChange={(e) => setEvenementEnEdition({ ...evenementEnEdition, impactPaie: e.target.checked })}
                      className="rounded text-[#149D92]"
                    />
                    <label htmlFor="chkImpactPaieModal" className="text-slate-700 font-medium">
                      Génère un gain ou une retenue
                    </label>
                  </div>
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
                Enregistrer l'événement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
