import React, { useState } from 'react';
import { FileText, Printer, Eye, User, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { Entreprise, Salarie } from '../../types';
import { formatMAD, formatDateJJMMAAAA } from '../../services/exportService';

interface DocumentsViewProps {
  entreprise: Entreprise;
  salaries: Salarie[];
  periodeActive: string;
}

export type TypeDocumentRH =
  | 'attestation_travail'
  | 'certificat_travail'
  | 'attestation_salaire_cnss'
  | 'fiche_renseignements'
  | 'demande_conge_modele'
  | 'solde_tout_compte';

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  entreprise,
  salaries,
  periodeActive
}) => {
  const [docActif, setDocActif] = useState<TypeDocumentRH>('attestation_travail');
  const [salarieId, setSalarieId] = useState<string>(salaries[0]?.id || '');

  const salarie = salaries.find((s) => s.id === salarieId) || salaries[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Panneau de sélection des modèles */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C2459]">Générateur de Documents RH Pédagogiques</h1>
              <p className="text-xs text-slate-500">
                Modèles conformes au droit marocain du travail · Prévisualisation et impression format A4
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le document (A4)</span>
          </button>
        </div>

        {/* Sélecteurs */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Salarié cible :</span>
            <select
              value={salarieId}
              onChange={(e) => setSalarieId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-[#1C2459] bg-slate-50"
            >
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.matricule} - {s.nom} {s.prenom} ({s.poste})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Type de document :</span>
            <select
              value={docActif}
              onChange={(e) => setDocActif(e.target.value as TypeDocumentRH)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-[#1C2459] bg-slate-50"
            >
              <option value="attestation_travail">Attestation de travail (Salarié en poste)</option>
              <option value="certificat_travail">Certificat de travail (Fin de contrat - Art. 72)</option>
              <option value="attestation_salaire_cnss">Attestation de salaire pour prestations CNSS</option>
              <option value="fiche_renseignements">Fiche individuelle de renseignements</option>
              <option value="demande_conge_modele">Titre &amp; Autorisation de congé annuel payé</option>
              <option value="solde_tout_compte">Reçu pour solde de tout compte (Art. 73-76)</option>
            </select>
          </div>
        </div>
      </div>

      {/* FEUILLE DE DOCUMENT FORMAT A4 (PRÉVISUALISATION ET IMPRESSION) */}
      <div className="bg-white border border-slate-300 rounded-xl p-10 max-w-3xl mx-auto shadow-md min-h-[700px] text-xs text-slate-800 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* En-tête officiel de l'entreprise */}
        <div className="border-b-2 border-[#1C2459] pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-black text-[#1C2459] uppercase tracking-wide">
              {entreprise.raisonSociale}
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">{entreprise.siegeSocial}, {entreprise.ville}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              RC: {entreprise.registreCommerce} · Patente: {entreprise.patente} · CNSS: {entreprise.numeroCNSS} · ICE: {entreprise.ice}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500 font-medium">
            <span>Fait à {entreprise.ville}, le </span>
            <strong className="text-slate-800">{new Date().toLocaleDateString('fr-FR')}</strong>
          </div>
        </div>

        {/* 1. ATTESTATION DE TRAVAIL */}
        {docActif === 'attestation_travail' && (
          <div className="space-y-6 pt-4">
            <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[#1C2459] border-b border-slate-200 pb-2">
              ATTESTATION DE TRAVAIL
            </h3>

            <p className="leading-relaxed text-sm">
              Je soussigné, <strong>{entreprise.representantLegal}</strong>, agissant en qualité de {entreprise.qualiteRepresentant} de la société <strong>{entreprise.raisonSociale}</strong>, certifie par la présente que :
            </p>

            <div className="bg-[#F4F7FA] p-5 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div>
                Nom et Prénom : <strong className="text-slate-900">{salarie.nom} {salarie.prenom}</strong>
              </div>
              <div>
                Titulaire de la Carte d'Identité Nationale (fictive) N° : <span className="font-mono font-bold">{salarie.cinFictif}</span>
              </div>
              <div>
                Immatriculé(e) à la CNSS sous le N° (fictif) : <span className="font-mono font-bold">{salarie.cnssFictif}</span>
              </div>
              <div>
                Fonction exercée : <strong className="text-slate-900">{salarie.poste}</strong>
              </div>
              <div>
                Date d'embauche : <strong>{formatDateJJMMAAAA(salarie.dateEmbauche)}</strong>
              </div>
            </div>

            <p className="leading-relaxed text-xs">
              Est actuellement employé(e) au sein de notre entreprise en vertu d'un contrat de travail régulier, et continue d'exercer ses fonctions à ce jour, libre de tout engagement envers des tiers.
            </p>

            <p className="leading-relaxed text-xs text-slate-500">
              La présente attestation lui est délivrée sur sa demande pour servir et valoir ce que de droit.
            </p>

            <div className="pt-8 flex justify-between items-end">
              <div className="text-[10px] text-slate-400 italic">
                Document pédagogique généré par le Simulateur RH OFPPT
              </div>
              <div className="text-center space-y-1">
                <span className="font-bold text-xs block text-slate-800">Pour la Direction Générale</span>
                <span className="text-[11px] text-slate-500 block">Cachet et signature</span>
                <div className="w-32 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                  Cachet Entreprise
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CERTIFICAT DE TRAVAIL (FIN DE CONTRAT - ART. 72) */}
        {docActif === 'certificat_travail' && (
          <div className="space-y-6 pt-4">
            <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[#1C2459] border-b border-slate-200 pb-2">
              CERTIFICAT DE TRAVAIL
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                Établi conformément à l'Article 72 du Code du Travail (Loi n° 65-99)
              </span>
            </h3>

            <p className="leading-relaxed text-sm">
              Nous soussignés, <strong>{entreprise.raisonSociale}</strong>, certifions que :
            </p>

            <div className="bg-[#F4F7FA] p-5 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div>Salarié(e) : <strong className="text-slate-900">{salarie.nom} {salarie.prenom}</strong></div>
              <div>CIN Fictive : <span className="font-mono font-bold">{salarie.cinFictif}</span></div>
              <div>N° CNSS Fictif : <span className="font-mono font-bold">{salarie.cnssFictif}</span></div>
              <div>A été employé(e) du : <strong>{formatDateJJMMAAAA(salarie.dateEmbauche)}</strong> au : <strong>{formatDateJJMMAAAA(salarie.dateSortie || '2025-03-31')}</strong></div>
              <div>En qualité exclusive de : <strong className="text-slate-900">{salarie.poste}</strong></div>
            </div>

            <p className="leading-relaxed text-xs">
              Conformément à la loi marocaine, ce certificat atteste exclusivement des dates d'entrée et de sortie du salarié, ainsi que des postes occupés, à l'exclusion de toute mention susceptible de lui porter préjudice.
            </p>

            <p className="leading-relaxed text-xs">
              M. / Mme {salarie.nom} {salarie.prenom} nous quitte ce jour libre de tout engagement.
            </p>

            <div className="pt-8 flex justify-end">
              <div className="text-center space-y-1">
                <span className="font-bold text-xs block text-slate-800">Le Représentant Légal</span>
                <span className="text-[11px] text-slate-500 block">{entreprise.representantLegal}</span>
                <div className="w-32 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                  Cachet &amp; Signature
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ATTESTATION DE SALAIRE POUR LA CNSS */}
        {docActif === 'attestation_salaire_cnss' && (
          <div className="space-y-6 pt-4">
            <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[#1C2459] border-b border-slate-200 pb-2">
              ATTESTATION DE SALAIRE POUR PRESTATIONS CNSS
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                (Indemnités Journalières de Maladie / Maternité / Déclaration d'incapacité)
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-4 bg-[#F4F7FA] p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Employeur :</span>
                <strong>{entreprise.raisonSociale}</strong>
                <div className="font-mono text-[10px] text-slate-500">N° Affiliation CNSS : {entreprise.numeroCNSS}</div>
              </div>
              <div>
                <span className="text-slate-500 block">Salarié(e) Assuré(e) :</span>
                <strong>{salarie.nom} {salarie.prenom}</strong>
                <div className="font-mono text-[10px] text-slate-500">N° Immatriculation : {salarie.cnssFictif}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#1C2459] mb-2 uppercase">
                Relevé des rémunérations brutes soumises à cotisation :
              </h4>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-[#1C2459] text-white">
                  <tr>
                    <th className="p-2">Mois / Année</th>
                    <th className="p-2 text-center">Jours Travaillés</th>
                    <th className="p-2 text-right">Salaire Brut Déclaré (MAD)</th>
                    <th className="p-2 text-right">Cotisations Retenues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  <tr>
                    <td className="p-2">Janvier 2025</td>
                    <td className="p-2 text-center">26 jours</td>
                    <td className="p-2 text-right">{formatMAD(salarie.salaireBaseMensuel)}</td>
                    <td className="p-2 text-right">{formatMAD(Math.min(salarie.salaireBaseMensuel, 6000) * 0.0448)}</td>
                  </tr>
                  <tr>
                    <td className="p-2">Février 2025</td>
                    <td className="p-2 text-center">26 jours</td>
                    <td className="p-2 text-right">{formatMAD(salarie.salaireBaseMensuel)}</td>
                    <td className="p-2 text-right">{formatMAD(Math.min(salarie.salaireBaseMensuel, 6000) * 0.0448)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-600">
              Nous certifions que les renseignements portés ci-dessus sont rigoureusement exacts et concordants avec nos déclarations de salaires mensuelles transmises à la CNSS.
            </p>

            <div className="pt-6 flex justify-end">
              <div className="text-center space-y-1">
                <span className="font-bold text-xs block">Pour l'Employeur</span>
                <div className="w-32 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                  Signature &amp; Cachet
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SOLDE DE TOUT COMPTE */}
        {docActif === 'solde_tout_compte' && (
          <div className="space-y-6 pt-4">
            <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[#1C2459] border-b border-slate-200 pb-2">
              REÇU POUR SOLDE DE TOUT COMPTE
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                Établi sous le régime des Articles 73 à 76 du Code du Travail marocain
              </span>
            </h3>

            <p className="leading-relaxed text-xs">
              Je soussigné(e), <strong>{salarie.nom} {salarie.prenom}</strong>, titulaire de la CIN (fictive) <strong>{salarie.cinFictif}</strong>, immatriculé(e) à la CNSS sous le N° <strong>{salarie.cnssFictif}</strong>, demeurant à {salarie.adresseFictive || salarie.ville},
            </p>

            <p className="leading-relaxed text-xs">
              Reconnais avoir reçu ce jour de la société <strong>{entreprise.raisonSociale}</strong>, la somme totale et forfaitaire de :
            </p>

            <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg text-center">
              <span className="text-xl font-bold text-[#149D92] font-mono">
                {formatMAD(salarie.salaireBaseMensuel * 1.5)}
              </span>
              <span className="text-[11px] text-teal-800 block mt-1">
                (Règlement par virement bancaire sur compte désigné)
              </span>
            </div>

            <div>
              <span className="font-bold text-xs block mb-1">Détail des sommes composant le versement :</span>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                <li>Salaire du dernier mois de travail effectif</li>
                <li>Indemnité compensatrice de congés payés non pris (solde de congés)</li>
                <li>Prorata des primes et gratifications acquises à la date de rupture</li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
              <strong>Mention manuscrite légale obligatoire (Art. 74) :</strong> Le salarié doit apposer de sa main la mention : <em>« Pour solde de tout compte, je reconnais avoir reçu la somme susmentionnée et renonce à toute réclamation ultérieure sous réserve du délai de dénonciation légal de 60 jours ».</em>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-6">
              <div className="text-center">
                <span className="font-bold text-xs block text-slate-800">Signature du Salarié</span>
                <span className="text-[10px] text-slate-400 block">(Précédée de la mention manuscrite et « Lu et approuvé »)</span>
                <div className="h-16 border-b border-slate-300"></div>
              </div>
              <div className="text-center">
                <span className="font-bold text-xs block text-slate-800">Pour l'Employeur</span>
                <span className="text-[10px] text-slate-400 block">Cachet et signature</span>
                <div className="h-16 border-b border-slate-300"></div>
              </div>
            </div>
          </div>
        )}

        {/* 5. TITRE ET AUTORISATION DE CONGÉ */}
        {docActif === 'demande_conge_modele' && (
          <div className="space-y-6 pt-4">
            <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[#1C2459] border-b border-slate-200 pb-2">
              TITRE DE CONGÉ ANNUEL PAYÉ
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                (Article 246 du Code du Travail)
              </span>
            </h3>

            <div className="bg-[#F4F7FA] p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div>Salarié bénéficiaire : <strong>{salarie.nom} {salarie.prenom} (Matricule : {salarie.matricule})</strong></div>
              <div>Poste occupé : <strong>{salarie.poste}</strong></div>
              <div>Période de congé accordée : <strong>du 10/02/2025 au 15/02/2025</strong></div>
              <div>Nombre de jours ouvrables décomptés : <strong>6 jours</strong></div>
              <div>Date prévue de reprise effective du travail : <strong>17/02/2025</strong></div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Le présent titre est remis au salarié avant son départ en congé annuel payé conformément aux obligations légales de l'employeur.
            </p>

            <div className="pt-8 flex justify-between items-end">
              <div className="text-center">
                <span className="font-bold text-xs block">Signature de l'Intéressé(e)</span>
                <div className="w-32 h-14 border border-dashed border-slate-300 rounded mt-1"></div>
              </div>
              <div className="text-center">
                <span className="font-bold text-xs block">Visa de la Direction RH</span>
                <div className="w-32 h-14 border border-dashed border-slate-300 rounded mt-1"></div>
              </div>
            </div>
          </div>
        )}

        {/* 6. FICHE DE RENSEIGNEMENTS INDIVIDUELS */}
        {docActif === 'fiche_renseignements' && (
          <div className="space-y-6 pt-4">
            <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[#1C2459] border-b border-slate-200 pb-2">
              FICHE INDIVIDUELLE DE RENSEIGNEMENTS SALARIÉ
            </h3>

            <div className="space-y-4 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <h4 className="font-bold text-[#1C2459] border-b pb-1">1. État Civil &amp; Coordonnées</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>Nom : <strong>{salarie.nom}</strong></div>
                  <div>Prénom : <strong>{salarie.prenom}</strong></div>
                  <div>Date de naissance : <strong>{formatDateJJMMAAAA(salarie.dateNaissance)}</strong></div>
                  <div>Lieu : <strong>{salarie.lieuNaissance}</strong></div>
                  <div>CIN Fictive : <strong>{salarie.cinFictif}</strong></div>
                  <div>Téléphone : <strong>{salarie.telephoneFictif}</strong></div>
                  <div className="col-span-2">Adresse : <strong>{salarie.adresseFictive || salarie.ville}</strong></div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <h4 className="font-bold text-[#1C2459] border-b pb-1">2. Situation Familiale &amp; Ayants droit</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>Situation : <strong className="capitalize">{salarie.situationFamiliale}</strong></div>
                  <div>Nombre d'enfants : <strong>{salarie.nombreEnfants}</strong></div>
                  <div>Personnes à charge fiscale (IR) : <strong>{salarie.nombrePersonnesACharge}</strong></div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <h4 className="font-bold text-[#1C2459] border-b pb-1">3. Données Professionnelles &amp; Bancaires</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>Matricule : <strong>{salarie.matricule}</strong></div>
                  <div>Poste : <strong>{salarie.poste}</strong></div>
                  <div>Date d'embauche : <strong>{formatDateJJMMAAAA(salarie.dateEmbauche)}</strong></div>
                  <div>N° CNSS : <strong>{salarie.cnssFictif}</strong></div>
                  <div className="col-span-2">RIB bancaire : <strong>{salarie.ribFictif}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
