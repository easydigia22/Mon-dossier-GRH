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
  X,
  Printer
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

  // Échappe le texte pour une insertion sûre dans le HTML d'impression
  const esc = (v: unknown): string =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // Styles communs aux documents imprimés (reprend la charte de l'app)
  const stylesImpression = `
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1f2937; margin: 24px; font-size: 12px; }
    .doc-entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1C2459; padding-bottom: 12px; margin-bottom: 18px; }
    .doc-entete h1 { color: #1C2459; font-size: 18px; margin: 0; }
    .doc-entete .sous-titre { color: #64748b; font-size: 11px; margin-top: 4px; }
    .doc-entete .meta { text-align: right; font-size: 11px; color: #64748b; }
    h2 { color: #1C2459; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #ECE3D6; padding-bottom: 4px; margin: 20px 0 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #FBF7F0; color: #475569; text-align: left; font-size: 10px; text-transform: uppercase; padding: 8px; border-bottom: 1px solid #ECE3D6; }
    td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
    .grille { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #FBF7F0; border: 1px solid #ECE3D6; border-radius: 8px; padding: 12px; }
    .champ .lbl { display: block; color: #64748b; font-size: 10px; }
    .champ .val { font-weight: 600; color: #1f2937; }
    .piece { display: flex; justify-content: space-between; padding: 7px 10px; border: 1px solid #ECE3D6; border-radius: 6px; margin-bottom: 6px; }
    .piece.fournie { background: #ecfdf5; border-color: #a7f3d0; }
    .badge { font-weight: 700; }
    .badge.ok { color: #047857; }
    .badge.ko { color: #b45309; }
    .histo { border-left: 2px solid #ECE3D6; padding-left: 12px; }
    .histo div { margin-bottom: 4px; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .pied { margin-top: 28px; padding-top: 10px; border-top: 1px solid #ECE3D6; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { margin: 12mm; } .doc-entete { page-break-after: avoid; } tr { page-break-inside: avoid; } }
  `;

  // Ouvre une fenêtre dédiée, écrit le document puis lance l'impression
  const lancerImpression = (titre: string, corps: string) => {
    const fenetre = window.open('', '_blank', 'width=900,height=1000');
    if (!fenetre) {
      showNotification(
        "Impossible d'ouvrir la fenêtre d'impression. Autorisez les pop-ups pour ce site.",
        'error'
      );
      return;
    }
    const dateEdition = formatDateJJMMAAAA(new Date().toISOString().split('T')[0]);
    fenetre.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" /><title>${esc(titre)}</title>
<style>${stylesImpression}</style></head>
<body>
${corps}
<div class="pied">Document généré le ${esc(dateEdition)} · Dossiers Administratifs du Personnel</div>
</body></html>`);
    fenetre.document.close();
    fenetre.focus();
    // Laisse le contenu se rendre avant d'appeler l'impression
    setTimeout(() => fenetre.print(), 300);
  };

  // Impression du dossier individuel complet d'un salarié
  const imprimerDossierIndividuel = (sal: Salarie) => {
    const annees = calculerAncienneteAnnees(sal.dateEmbauche, periodeActive);
    const { libelle: libelleAnc } = getTauxAnciennete(annees);
    const piecesFournies = sal.checklistDossier.filter((p) => p.estFournie).length;

    const corps = `
      <div class="doc-entete">
        <div>
          <h1>Dossier Individuel du Salarié</h1>
          <div class="sous-titre">${esc(sal.nom)} ${esc(sal.prenom)} · ${esc(sal.poste)} (${esc(sal.departement)})</div>
        </div>
        <div class="meta">Matricule : <strong>${esc(sal.matricule)}</strong><br/>Statut : ${esc(sal.statut)}</div>
      </div>

      <h2>État civil &amp; identification</h2>
      <div class="grille">
        <div class="champ"><span class="lbl">CIN Fictive</span><span class="val">${esc(sal.cinFictif)}</span></div>
        <div class="champ"><span class="lbl">N° CNSS Fictif</span><span class="val">${esc(sal.cnssFictif)}</span></div>
        <div class="champ"><span class="lbl">Date de naissance</span><span class="val">${esc(formatDateJJMMAAAA(sal.dateNaissance))}</span></div>
        <div class="champ"><span class="lbl">Situation familiale</span><span class="val">${esc(sal.situationFamiliale)} · ${esc(sal.nombreEnfants)} enfant(s)</span></div>
        <div class="champ"><span class="lbl">Personnes à charge (IR)</span><span class="val">${esc(sal.nombrePersonnesACharge)}</span></div>
        <div class="champ"><span class="lbl">Téléphone</span><span class="val">${esc(sal.telephoneFictif)}</span></div>
      </div>

      <h2>Situation professionnelle</h2>
      <div class="grille">
        <div class="champ"><span class="lbl">Date d'embauche</span><span class="val">${esc(formatDateJJMMAAAA(sal.dateEmbauche))}</span></div>
        <div class="champ"><span class="lbl">Ancienneté</span><span class="val">${esc(annees)} an(s) · ${esc(libelleAnc)}</span></div>
        <div class="champ"><span class="lbl">Qualification</span><span class="val">${esc(sal.qualification)}</span></div>
        <div class="champ"><span class="lbl">Salaire de base</span><span class="val">${esc(formatMAD(sal.salaireBaseMensuel))}</span></div>
        <div class="champ"><span class="lbl">Mode de paiement</span><span class="val">${esc(sal.modePaiement)}</span></div>
        <div class="champ"><span class="lbl">Banque &amp; RIB Fictif</span><span class="val">${esc(sal.banqueFictive)} · ${esc(sal.ribFictif)}</span></div>
      </div>

      <h2>Checklist des pièces (${esc(piecesFournies)}/${esc(sal.checklistDossier.length)} fournies)</h2>
      ${sal.checklistDossier
        .map(
          (p) => `<div class="piece ${p.estFournie ? 'fournie' : ''}">
            <span>${esc(p.nom)} <em style="color:#94a3b8">· ${esc(p.categorie)}${p.estObligatoire ? ' · requise' : ''}</em></span>
            <span class="badge ${p.estFournie ? 'ok' : 'ko'}">${p.estFournie ? 'Fournie' : 'Manquante'}${
            p.dateReception ? ' (' + esc(formatDateJJMMAAAA(p.dateReception)) + ')' : ''
          }</span>
          </div>`
        )
        .join('')}

      <h2>Historique administratif</h2>
      <div class="histo">
        ${sal.historiqueEvenements
          .map(
            (h) =>
              `<div><strong>${esc(formatDateJJMMAAAA(h.date))}</strong> : ${esc(h.description)} <span style="color:#94a3b8">(${esc(h.auteur)})</span></div>`
          )
          .join('')}
      </div>
    `;
    lancerImpression(`Dossier ${sal.matricule} - ${sal.nom} ${sal.prenom}`, corps);
  };

  // Impression de la liste du personnel (selon le filtre/recherche en cours)
  const imprimerListe = () => {
    if (salariesFiltres.length === 0) {
      showNotification('Aucun salarié à imprimer avec les filtres actuels.', 'warning');
      return;
    }
    const libelleFiltre =
      filtreStatut === 'tous' ? 'Tous les statuts' : filtreStatut === 'actif' ? 'Actifs' : 'Sortis';
    const lignes = salariesFiltres
      .map((sal) => {
        const annees = calculerAncienneteAnnees(sal.dateEmbauche, periodeActive);
        const piecesFournies = sal.checklistDossier.filter((p) => p.estFournie).length;
        return `<tr>
          <td>${esc(sal.matricule)}</td>
          <td>${esc(sal.nom)} ${esc(sal.prenom)}<br/><span style="color:#94a3b8">${esc(sal.cinFictif)}</span></td>
          <td>${esc(sal.poste)}<br/><span style="color:#94a3b8">${esc(sal.departement)}</span></td>
          <td>${esc(formatDateJJMMAAAA(sal.dateEmbauche))}</td>
          <td>${esc(annees)} an(s)</td>
          <td class="num">${esc(formatMAD(sal.salaireBaseMensuel))}</td>
          <td>${esc(piecesFournies)}/${esc(sal.checklistDossier.length)}</td>
        </tr>`;
      })
      .join('');

    const corps = `
      <div class="doc-entete">
        <div>
          <h1>Liste du Personnel</h1>
          <div class="sous-titre">${esc(salariesFiltres.length)} salarié(s) · Filtre : ${esc(libelleFiltre)}${
      recherche ? ' · Recherche : "' + esc(recherche) + '"' : ''
    }</div>
        </div>
        <div class="meta">Période active : ${esc(periodeActive)}</div>
      </div>
      <table>
        <thead><tr>
          <th>Matricule</th><th>Salarié</th><th>Poste &amp; Service</th>
          <th>Date Embauche</th><th>Ancienneté</th><th class="num">Salaire Base</th><th>Dossier</th>
        </tr></thead>
        <tbody>${lignes}</tbody>
      </table>
    `;
    lancerImpression('Liste du Personnel', corps);
  };

  return (
    <div className="space-y-6">
      {/* En-tête du module */}
      <div className="bg-white border border-[#ECE3D6] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1C2459]">Dossiers Administratifs du Personnel</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion des collaborateurs, fiches individuelles, pièces réglementaires et ancienneté (Art. 350)
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={imprimerListe}
              className="px-3.5 py-2 bg-white border border-[#ECE3D6] hover:bg-slate-50 text-[#1C2459] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              title="Imprimer la liste du personnel (selon les filtres en cours)"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la liste</span>
            </button>
            <button
              onClick={handleOuvrirNouveau}
              className="px-3.5 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un salarié</span>
            </button>
          </div>
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
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#ECE3D6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#149D92] bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500">Statut :</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-[#ECE3D6]">
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
      <div className="bg-white border border-[#ECE3D6] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#FBF7F0] text-slate-600 border-b border-[#ECE3D6] uppercase text-[11px] font-semibold">
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
          <div className="bg-white rounded-xl shadow-xl border border-[#ECE3D6] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#ECE3D6] flex items-center justify-between sticky top-0 bg-white z-10">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FBF7F0] p-4 rounded-lg border border-[#ECE3D6] text-xs">
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
                          : 'bg-white border-[#ECE3D6] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            piece.estFournie ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#E3D8C8] bg-white'
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
                <div className="space-y-1.5 border-l-2 border-[#ECE3D6] pl-3">
                  {salarieSelectionne.historiqueEvenements.map((h, i) => (
                    <div key={i} className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{formatDateJJMMAAAA(h.date)}</span> : {h.description}
                      <span className="text-slate-400 text-[10px] ml-1.5">({h.auteur})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#ECE3D6] bg-slate-50 flex justify-between gap-2 sticky bottom-0">
              <button
                onClick={() => imprimerDossierIndividuel(salarieSelectionne)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-[#ECE3D6] text-[#1C2459] rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
                title="Imprimer ce dossier individuel"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le dossier</span>
              </button>
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
            className="bg-white rounded-xl shadow-xl border border-[#ECE3D6] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-[#ECE3D6] flex items-center justify-between sticky top-0 bg-white z-10">
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Statut</label>
                  <select
                    value={nouveauSalarie.statut || 'actif'}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, statut: e.target.value as StatutSalarie })}
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.prenom || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, prenom: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">N° CNSS Fictif</label>
                  <input
                    type="text"
                    required
                    value={nouveauSalarie.cnssFictif || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, cnssFictif: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded font-mono"
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
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
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Département</label>
                  <input
                    type="text"
                    value={nouveauSalarie.departement || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, departement: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date d'embauche</label>
                  <input
                    type="date"
                    required
                    value={nouveauSalarie.dateEmbauche || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, dateEmbauche: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Salaire de base mensuel (MAD)</label>
                  <input
                    type="number"
                    min="3120"
                    step="any"
                    required
                    value={nouveauSalarie.salaireBaseMensuel || 0}
                    onChange={(e) =>
                      setNouveauSalarie({ ...nouveauSalarie, salaireBaseMensuel: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded font-semibold"
                  />
                  <span className="text-[10px] text-slate-500">Pour 191h normales par mois</span>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">RIB Fictif</label>
                  <input
                    type="text"
                    value={nouveauSalarie.ribFictif || ''}
                    onChange={(e) => setNouveauSalarie({ ...nouveauSalarie, ribFictif: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#ECE3D6] rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#ECE3D6] bg-slate-50 flex justify-end gap-2">
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
