import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  FileCheck2,
  FileX2,
  Calendar,
  CreditCard,
  Briefcase,
  AlertTriangle,
  Eye,
  Edit,
  Check,
  X
} from 'lucide-react';
import { PieceDossier, Salarie, SituationFamiliale, StatutSalarie } from '../../types';
import { formatMAD, formatDateJJMMAAAA } from '../../services/exportService';
import { calculerAncienneteAnnees, getTauxAnciennete } from '../../services/payrollEngine';

interface EmployeesViewProps {
  salaries: Salarie[];
  periodeActive: string;
  onSaveSalarie: (sal: Salarie) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  salaries,
  periodeActive,
  onSaveSalarie,
  showNotification
}) => {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [salarieSelectionne, setSalarieSelectionne] = useState<Salarie | null>(null);
  const [modalEditionOuverte, setModalEditionOuverte] = useState(false);
  const [nouveauSalarie, setNouveauSalarie] = useState<Partial<Salarie> | null>(null);

  const salariesFiltres = salaries.filter((s) => {
    const matchTexte =
      s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      s.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
      s.matricule.toLowerCase().includes(recherche.toLowerCase()) ||
      s.poste.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || s.statut === filtreStatut;
    return matchTexte && matchStatut;
  });

  const handleOuvrirNouveau = () => {
    const nextMatricule = `M${String(salaries.length + 1).padStart(3, '0')}`;
    setNouveauSalarie({
      id: `sal-${Date.now()}`,
      matricule: nextMatricule,
      nom: '',
      prenom: '',
      dateNaissance: '1995-01-01',
      lieuNaissance: 'Marrakech',
      nationalite: 'Marocaine',
      cinFictif: 'FICTIF-AB000000',
      cnssFictif: 'CNSS-FIC-000000000',
      telephoneFictif: '+212 6 00 00 00 00',
      emailFictif: '',
      adresseFictive: '',
      ville: 'Marrakech',
      situationFamiliale: 'celibataire',
      nombreEnfants: 0,
      nombrePersonnesACharge: 0,
      poste: 'Nouvel Emploi',
      departement: 'Administration',
      qualification: 'Employé',
      dateEmbauche: '2025-01-01',
      statut: 'actif',
      salaireBaseMensuel: 4000,
      horaireMensuel: 191,
      modePaiement: 'virement',
      banqueFictive: 'Attijariwafa Bank',
      ribFictif: '007 450 0000000000000000 00',
      checklistDossier: [
        { id: 'c1', nom: 'Contrat de travail signé', categorie: 'legale', estObligatoire: true, estFournie: false },
        { id: 'c2', nom: 'Copie CIN légalisée (fictive)', categorie: 'legale', estObligatoire: true, estFournie: false },
        { id: 'c3', nom: 'Fiche d\'immatriculation CNSS', categorie: 'legale', estObligatoire: true, estFournie: false },
        { id: 'c4', nom: 'Fiche de renseignements individuels', categorie: 'entreprise', estObligatoire: true, estFournie: false }
      ],
      historiqueEvenements: [
        { date: new Date().toISOString().split('T')[0], description: 'Création du dossier administratif', auteur: 'Gestionnaire RH' }
      ]
    });
    setModalEditionOuverte(true);
  };

  const handleEnregistrerSalarie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauSalarie || !nouveauSalarie.nom || !nouveauSalarie.prenom) {
      showNotification('Veuillez renseigner au moins le nom et prénom.', 'error');
      return;
    }
    onSaveSalarie(nouveauSalarie as Salarie);
    setModalEditionOuverte(false);
    setNouveauSalarie(null);
  };

  const handleTogglePiece = (salarie: Salarie, pieceId: string) => {
    const updatedChecklist = salarie.checklistDossier.map((p) =>
      p.id === pieceId ? { ...p, estFournie: !p.estFournie, dateReception: !p.estFournie ? new Date().toISOString().split('T')[0] : undefined } : p
    );
    const updatedSalarie = { ...salarie, checklistDossier: updatedChecklist };
    onSaveSalarie(updatedSalarie);
    if (salarieSelectionne && salarieSelectionne.id === salarie.id) {
      setSalarieSelectionne(updatedSalarie);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du module */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1C2459]">Dossiers Administratifs du Personnel</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion des collaborateurs, fiches individuelles, pièces réglementaires et ancienneté (Art. 350)
            </p>
          </div>
          <button
            onClick={handleOuvrirNouveau}
            className="px-3.5 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un salarié</span>
          </button>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, poste..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#149D92] bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500">Statut :</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setFiltreStatut('tous')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  filtreStatut === 'tous' ? 'bg-white text-[#1C2459] font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Tous ({salaries.length})
              </button>
              <button
                onClick={() => setFiltreStatut('actif')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  filtreStatut === 'actif' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setFiltreStatut('sorti')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  filtreStatut === 'sorti' ? 'bg-white text-slate-700 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Sortis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des salariés */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#F4F7FA] text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Salarié</th>
                <th className="py-3 px-4">Poste &amp; Service</th>
                <th className="py-3 px-4">Date Embauche</th>
                <th className="py-3 px-4">Ancienneté</th>
                <th className="py-3 px-4 text-right">Salaire Base</th>
                <th className="py-3 px-4 text-center">Dossier</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salariesFiltres.map((sal) => {
                const annees = calculerAncienneteAnnees(sal.dateEmbauche, periodeActive);
                const { libelle: libelleAnc } = getTauxAnciennete(annees);
                const piecesFournies = sal.checklistDossier.filter((p) => p.estFournie).length;
                const totalPieces = sal.checklistDossier.length;
                const dossierComplet = piecesFournies === totalPieces;

                return (
                  <tr key={sal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1C2459]">{sal.matricule}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {sal.nom} {sal.prenom}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sal.cinFictif} · {sal.cnssFictif}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{sal.poste}</div>
                      <div className="text-[11px] text-slate-500">{sal.departement}</div>
                    </td>
                    <td className="py-3 px-4 tabular-nums">{formatDateJJMMAAAA(sal.dateEmbauche)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{annees} an(s)</span>
                      <div className="text-[10px] text-[#149D92]">{libelleAnc}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                      {formatMAD(sal.salaireBaseMensuel)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                          dossierComplet ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {dossierComplet ? <FileCheck2 className="w-3.5 h-3.5" /> : <FileX2 className="w-3.5 h-3.5" />}
                        <span>
                          {piecesFournies}/{totalPieces}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSalarieSelectionne(sal)}
                          className="p-1.5 text-slate-600 hover:text-[#149D92] hover:bg-slate-100 rounded transition-colors"
                          title="Consulter le dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setNouveauSalarie(sal);
                            setModalEditionOuverte(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-[#1C2459] hover:bg-slate-100 rounded transition-colors"
                          title="Modifier les informations"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Fiche détaillée du salarié sélectionné */}
      {salarieSelectionne && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center font-bold">
                  {salarieSelectionne.matricule}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C2459]">
                    Dossier Individuel : {salarieSelectionne.nom} {salarieSelectionne.prenom}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {salarieSelectionne.poste} · Embauché le {formatDateJJMMAAAA(salarieSelectionne.dateEmbauche)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSalarieSelectionne(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations d'état civil et identification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F4F7FA] p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">CIN Fictive</span>
                  <span className="font-mono font-bold text-slate-800">{salarieSelectionne.cinFictif}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">N° CNSS Fictif</span>
                  <span className="font-mono font-bold text-slate-800">{salarieSelectionne.cnssFictif}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Situation familiale</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {salarieSelectionne.situationFamiliale} · {salarieSelectionne.nombreEnfants} enfant(s)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Charges de famille (IR)</span>
                  <span className="font-semibold text-[#149D92]">
                    {salarieSelectionne.nombrePersonnesACharge} personne(s) ({salarieSelectionne.nombrePersonnesACharge * 30} MAD/mois)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Salaire de Base</span>
                  <span className="font-bold text-[#1C2459]">{formatMAD(salarieSelectionne.salaireBaseMensuel)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Banque &amp; RIB Fictif</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate block">{salarieSelectionne.ribFictif}</span>
                </div>
              </div>

              {/* Checklist des pièces du dossier avec catégories */}
              <div>
                <h4 className="text-xs font-bold text-[#1C2459] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Checklist des pièces du dossier administratif</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Cochez pour marquer la réception de la pièce
                  </span>
                </h4>
                <div className="space-y-2">
                  {salarieSelectionne.checklistDossier.map((piece) => (
                    <div
                      key={piece.id}
                      onClick={() => handleTogglePiece(salarieSelectionne, piece.id)}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        piece.estFournie
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            piece.estFournie ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {piece.estFournie && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="font-medium">{piece.nom}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="capitalize">Catégorie : {piece.categorie}</span>
                            {piece.estObligatoire && <span className="text-amber-700 font-semibold">· Légalement requise</span>}
                            {piece.dateReception && <span>· Reçu le {formatDateJJMMAAAA(piece.dateReception)}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold">
                        {piece.estFournie ? 'Fournie' : 'Manquante'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historique des événements du salarié */}
              <div>
                <h4 className="text-xs font-bold text-[#1C2459] uppercase tracking-wider mb-2">
                  Historique administratif
                </h4>
                <div className="space-y-1.5 border-l-2 border-slate-200 pl-3">
                  {salarieSelectionne.historiqueEvenements.map((h, i) => (
                    <div key={i} className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{formatDateJJMMAAAA(h.date)}</span> : {h.description}
                      <span className="text-slate-400 text-[10px] ml-1.5">({h.auteur})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSalarieSelectionne(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#1C2459] text-white rounded-lg hover:bg-[#11273e]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création / Modification Salarié */}
      {modalEditionOuverte && nouveauSalarie && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEnregistrerSalarie}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-[#1C2459]">
                {salaries.some((s) => s.id === nouveauSalarie.id) ? 'Modifier le salarié' : 'Créer un nouveau salarié'}
              </h3>
              <button
                type="button"
                onClick={() => setModalEditionOuverte(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Matricule</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.matricule || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, matricule: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Statut</label>
                  <select
                    value={nouveauSalarie.statut || 'actif'}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, statut: e.target.value as StatutSalarie })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="actif">Actif</option>
                    <option value="sorti">Sorti</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.nom || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, nom: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.prenom || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, prenom: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">CIN Fictive</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.cinFictif || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, cinFictif: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">N° CNSS Fictif</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.cnssFictif || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, cnssFictif: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Situation Familiale</label>
                  <select
                    value={nouveauSalarie.situationFamiliale || 'celibataire'}
                    onChange={(e) =>
                      setNouveauSalarie({ ...nouveauSalarie, situationFamiliale: e.target.value as SituationFamiliale })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="celibataire">Célibataire</option>
                    <option value="marie">Marié(e)</option>
                    <option value="divorce">Divorcé(e)</option>
                    <option value="veuf">Veuf/ve</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nombre d'enfants</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={nouveauSalarie.nombreEnfants ?? 0}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, nombreEnfants: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Personnes à charge (IR)</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={nouveauSalarie.nombrePersonnesACharge ?? 0}
                    onChange={(e) =>
                      setNouveauSalarie({ ...nouveauSalarie, nombrePersonnesACharge: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Poste</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.poste || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, poste: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Département</label>
                  <input
                    type="text"
                    value={nouveauSalarie.departement || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, departement: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date d'embauche</label>
                  <input
                    type="date"
                    required
                    value={nouveauSalarie.dateEmbauche || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, dateEmbauche: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Salaire de base mensuel (MAD)</label>
                  <input
                    type="number"
                    min="3120"
                    step="10"
                    required
                    value={nouveauSalarie.salaireBaseMensuel || 0}
                    onChange={(e) =>
                      setNouveauSalarie({ ...nouveauSalarie, salaireBaseMensuel: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                  />
                  <span className="text-[10px] text-slate-500">Pour 191h normales par mois</span>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">RIB Fictif</label>
                  <input
                    type="text"
                    value={nouveauSalarie.ribFictif || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, ribFictif: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalEditionOuverte(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#149D92] text-white rounded-lg hover:bg-[#11857c]"
              >
                Enregistrer le salarié
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
