import React, { useMemo, useState } from 'react';
import { Gavel, Printer, Plus, AlertTriangle, CheckCircle2, Clock, FileText, History } from 'lucide-react';
import { DemandeConge, Entreprise, ProcedureDisciplinaire, Salarie, SanctionDisciplinaire, TypeFauteDisciplinaire } from '../../types';
import { calculerSoldeToutCompte, detecterAlertesConformite } from '../../services/disciplineEngine';
import { formatDateJJMMAAAA, formatMAD } from '../../services/exportService';

interface DisciplineViewProps {
  salaries: Salarie[];
  demandesConges: DemandeConge[];
  procedures: ProcedureDisciplinaire[];
  onSaveProcedure: (p: ProcedureDisciplinaire) => void;
  onDeleteProcedure: (id: string) => void;
  entreprise: Entreprise;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

type DocumentImprimable = 'convocation' | 'pv' | 'notification' | 'solde' | null;

export const DisciplineView: React.FC<DisciplineViewProps> = ({
  salaries,
  demandesConges,
  procedures,
  onSaveProcedure,
  onDeleteProcedure,
  entreprise,
  showNotification
}) => {
  const [salarieActifId, setSalarieActifId] = useState<string>(salaries[0]?.id || '');
  const salarieActif = salaries.find((s) => s.id === salarieActifId);

  const procedureOuverte = procedures.find((p) => p.salarieId === salarieActifId && p.statut === 'ouverte');
  const [procedureEnCours, setProcedureEnCours] = useState<ProcedureDisciplinaire | null>(procedureOuverte || null);
  const [documentAImprimer, setDocumentAImprimer] = useState<DocumentImprimable>(null);

  const procedure = procedureEnCours;

  // Une procédure clôturée se consulte et s'imprime, mais ne se modifie plus.
  const lectureSeule = procedure?.statut === 'cloturee';

  // Source unique de vérité du solde de tout compte : toujours recalculé depuis
  // la procédure (dont les saisies de l'étape 5 sont persistées). Le tableau à
  // l'écran et le reçu imprimable lisent tous les deux cette même valeur, ce qui
  // les empêche de diverger — ou le reçu de sortir vide faute d'instantané.
  const calculSolde = useMemo(
    () =>
      salarieActif && procedure
        ? calculerSoldeToutCompte({ salarie: salarieActif, procedure, demandes: demandesConges })
        : null,
    [salarieActif, procedure, demandesConges]
  );

  const handleNouvelleProcedure = () => {
    if (!salarieActif || procedureOuverte) return;
    const nouvelle: ProcedureDisciplinaire = {
      id: `disc-${Date.now()}`,
      salarieId: salarieActif.id,
      typeFaute: 'legere',
      motifFaute: '',
      dateConstatation: new Date().toISOString().slice(0, 10),
      categorieSalarie: 'non_cadre',
      assistanceDemandee: false,
      statut: 'ouverte',
      creeLe: new Date().toISOString(),
      misAJourLe: new Date().toISOString()
    };
    setProcedureEnCours(nouvelle);
    onSaveProcedure(nouvelle);
  };

  const majProcedure = (champs: Partial<ProcedureDisciplinaire>) => {
    if (!procedure || lectureSeule) return;
    const maj = { ...procedure, ...champs };
    setProcedureEnCours(maj);
    onSaveProcedure(maj);
  };

  const handleImprimer = (doc: DocumentImprimable) => {
    setDocumentAImprimer(doc);
    setTimeout(() => window.print(), 100);
  };

  const historiqueClos = procedures.filter((p) => p.salarieId === salarieActifId && p.statut === 'cloturee');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <Gavel className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C2459]">Discipline &amp; Licenciement</h1>
              <p className="text-xs text-slate-500">
                Procédure disciplinaire marocaine complète : convocation, entretien, sanction, solde de tout compte
              </p>
            </div>
          </div>

          <select
            value={salarieActifId}
            onChange={(e) => {
              setSalarieActifId(e.target.value);
              setProcedureEnCours(procedures.find((p) => p.salarieId === e.target.value && p.statut === 'ouverte') || null);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-[#1C2459] bg-slate-50 text-xs"
          >
            {salaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.matricule} — {s.nom} {s.prenom}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 text-[11px] text-amber-900">
          Simulation pédagogique — ne remplace ni un conseil juridique ni une procédure réelle devant les prud'hommes.
        </div>
      </div>

      {/* Garde-fou : une seule procédure ouverte à la fois par salarié */}
      {!procedure && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print text-center space-y-3">
          {procedureOuverte ? (
            <p className="text-sm text-slate-600">
              Une procédure disciplinaire est déjà ouverte pour {salarieActif?.nom} {salarieActif?.prenom}
              {' '}(constatée le {formatDateJJMMAAAA(procedureOuverte.dateConstatation)}). Clôturez-la ou
              supprimez-la avant d'en ouvrir une nouvelle.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Aucune procédure disciplinaire ouverte pour {salarieActif?.nom} {salarieActif?.prenom}.
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            {procedureOuverte && (
              <button
                onClick={() => setProcedureEnCours(procedureOuverte)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C2459] hover:bg-[#161c47] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Reprendre la procédure en cours
              </button>
            )}
            <button
              onClick={handleNouvelleProcedure}
              disabled={!salarieActif || !!procedureOuverte}
              title={procedureOuverte ? 'Une procédure est déjà ouverte pour ce salarié' : undefined}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Nouvelle procédure
            </button>
          </div>
        </div>
      )}

      {procedure && lectureSeule && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 no-print flex items-center justify-between gap-3">
          <span className="text-xs text-slate-700 font-medium flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Procédure clôturée — consultation et impression uniquement, aucune modification possible.
          </span>
          <button
            onClick={() => setProcedureEnCours(null)}
            className="text-[11px] font-semibold text-[#1C2459] hover:underline shrink-0"
          >
            Fermer
          </button>
        </div>
      )}

      {procedure && (
        <>
          {/* Étape 1 — Qualification */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">1</span>
                Qualification de la faute
              </h2>
              {!lectureSeule && (
                <button
                  onClick={() => {
                    onDeleteProcedure(procedure.id);
                    setProcedureEnCours(null);
                  }}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Supprimer cette procédure (ouverte par erreur)
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="text-slate-600 font-medium">Type de faute</span>
                <select
                  value={procedure.typeFaute}
                  onChange={(e) => majProcedure({ typeFaute: e.target.value as TypeFauteDisciplinaire })}
                  disabled={lectureSeule}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="legere">Faute légère (Art. 37)</option>
                  <option value="grave">Faute grave (Art. 39)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Catégorie du salarié</span>
                <select
                  value={procedure.categorieSalarie}
                  onChange={(e) => majProcedure({ categorieSalarie: e.target.value as 'cadre' | 'non_cadre' })}
                  disabled={lectureSeule}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="non_cadre">Non-cadre</option>
                  <option value="cadre">Cadre</option>
                </select>
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Date de constatation</span>
                <input
                  type="date"
                  value={procedure.dateConstatation}
                  onChange={(e) => majProcedure({ dateConstatation: e.target.value })}
                  disabled={lectureSeule}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-slate-600 font-medium">Motif de la faute</span>
                <textarea
                  value={procedure.motifFaute}
                  onChange={(e) => majProcedure({ motifFaute: e.target.value })}
                  rows={2}
                  disabled={lectureSeule}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Décrivez les faits reprochés au salarié..."
                />
              </label>
            </div>
          </div>

          {procedure.motifFaute && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">2</span>
                Convocation à l'entretien préalable
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs items-end">
                <label className="block">
                  <span className="text-slate-600 font-medium">Date de convocation</span>
                  <input
                    type="date"
                    value={procedure.dateConvocation || ''}
                    onChange={(e) => majProcedure({ dateConvocation: e.target.value })}
                    disabled={lectureSeule}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={lectureSeule}
                    checked={procedure.assistanceDemandee}
                    onChange={(e) => majProcedure({ assistanceDemandee: e.target.checked })}
                  />
                  <span className="text-slate-600">Assistance d'un représentant demandée</span>
                </label>
              </div>
              {procedure.dateConvocation && (
                <button
                  onClick={() => handleImprimer('convocation')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer la lettre de convocation
                </button>
              )}
            </div>
          )}

          {procedure.dateConvocation && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">3</span>
                Entretien préalable &amp; procès-verbal
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="text-slate-600 font-medium">Date de l'entretien</span>
                  <input
                    type="date"
                    value={procedure.dateEntretien || ''}
                    onChange={(e) => majProcedure({ dateEntretien: e.target.value })}
                    disabled={lectureSeule}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-600 font-medium">Signature du procès-verbal</span>
                  <select
                    value={procedure.signePar || ''}
                    onChange={(e) => majProcedure({ signePar: e.target.value as ProcedureDisciplinaire['signePar'] })}
                    disabled={lectureSeule}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">—</option>
                    <option value="les_deux">Signé par les deux parties</option>
                    <option value="salarie_absent">Salarié absent à l'entretien</option>
                    <option value="refus_signature">Refus de signature du salarié</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-slate-600 font-medium">Résumé de l'entretien</span>
                  <textarea
                    value={procedure.resumeEntretien || ''}
                    onChange={(e) => majProcedure({ resumeEntretien: e.target.value })}
                    rows={2}
                    disabled={lectureSeule}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </label>
              </div>
              {procedure.dateEntretien && (
                <button
                  onClick={() => handleImprimer('pv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer le procès-verbal
                </button>
              )}
            </div>
          )}

          {procedure.dateEntretien && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">4</span>
                Décision disciplinaire
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="text-slate-600 font-medium">Sanction</span>
                  <select
                    value={procedure.sanction || ''}
                    onChange={(e) => majProcedure({ sanction: e.target.value as SanctionDisciplinaire })}
                    disabled={lectureSeule}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">—</option>
                    {procedure.typeFaute === 'legere' ? (
                      <>
                        <option value="avertissement">Avertissement</option>
                        <option value="blame">Blâme</option>
                        <option value="mise_a_pied">Mise à pied (≤ 8 jours)</option>
                      </>
                    ) : (
                      <option value="licenciement">Licenciement (sans préavis ni indemnité si conforme)</option>
                    )}
                  </select>
                </label>
                {procedure.sanction === 'mise_a_pied' && (
                  <label className="block">
                    <span className="text-slate-600 font-medium">Jours de mise à pied (max 8, Art. 37)</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={procedure.joursMiseAPied || 1}
                      onChange={(e) => majProcedure({ joursMiseAPied: Math.min(8, Math.max(1, Number(e.target.value))) })}
                      disabled={lectureSeule}
                      className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-slate-600 font-medium">Date de notification</span>
                  <input
                    type="date"
                    value={procedure.dateNotificationSanction || ''}
                    onChange={(e) => majProcedure({ dateNotificationSanction: e.target.value })}
                    disabled={lectureSeule}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </label>
              </div>

              {detecterAlertesConformite(procedure).map((alerte) => (
                <div
                  key={alerte.code}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] ${
                    alerte.severite === 'risque' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{alerte.message}</span>
                </div>
              ))}

              {procedure.dateNotificationSanction && (
                <button
                  onClick={() => handleImprimer('notification')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer la notification de sanction
                </button>
              )}
            </div>
          )}

          {procedure.sanction === 'licenciement' && procedure.dateNotificationSanction && salarieActif && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-4">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">5</span>
                Solde de tout compte
              </h2>

              {(() => {
                const calcul = calculSolde;
                if (!calcul) return null;
                const lignes: { libelle: string; formule: string; montant: number }[] = [
                  { libelle: 'Salaire prorata du mois de sortie', formule: 'salaire ÷ 30 × jour du mois', montant: calcul.salaireProrataMoisSortie },
                  { libelle: 'Prime d\'ancienneté (dernier mois)', formule: 'Art. 350', montant: calcul.primeAncienneteSolde },
                  { libelle: 'Indemnité congés restants', formule: 'jours restants × salaire/26', montant: calcul.indemniteCongesRestants },
                  { libelle: 'Indemnité de licenciement', formule: 'Art. 53 (0 si faute grave conforme)', montant: calcul.indemniteLicenciement },
                  { libelle: 'Indemnité compensatrice de préavis', formule: 'Art. 43, 51 (0 si faute grave conforme)', montant: calcul.indemnitePreavis },
                  { libelle: 'Dommages-intérêts (licenciement abusif)', formule: 'Art. 41', montant: calcul.dommagesInteretsAbusif },
                  { libelle: 'Intérêts de retard', formule: `${calcul.tauxInteretAnnuel}% × ${calcul.joursRetardPaiement}j / 365`, montant: calcul.interetsRetard }
                ];

                return (
                  <>
                    {calcul.alertesConformite.map((a) => (
                      <div key={a.code} className="flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] bg-red-50 text-red-800 border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{a.message}</span>
                      </div>
                    ))}

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        disabled={lectureSeule}
                        checked={procedure.licenciementAbusifForce ?? calcul.licenciementAbusif}
                        onChange={(e) => majProcedure({ licenciementAbusifForce: e.target.checked })}
                      />
                      <span className="text-slate-700 font-medium">Licenciement jugé abusif (ajuste les dommages-intérêts Art. 41)</span>
                    </label>

                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <label className="block">
                        <span className="text-slate-600 font-medium">Jours de retard de paiement</span>
                        <input
                          type="number"
                          min={0}
                          value={procedure.joursRetardPaiement ?? calcul.joursRetardPaiement}
                          onChange={(e) => majProcedure({ joursRetardPaiement: Math.max(0, Number(e.target.value) || 0) })}
                          disabled={lectureSeule}
                          className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </label>
                      <label className="block">
                        <span className="text-slate-600 font-medium">Taux d'intérêt annuel (%)</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={procedure.tauxInteretAnnuel ?? calcul.tauxInteretAnnuel}
                          onChange={(e) => majProcedure({ tauxInteretAnnuel: Math.max(0, Number(e.target.value) || 0) })}
                          disabled={lectureSeule}
                          className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </label>
                    </div>

                    <table className="w-full text-xs">
                      <tbody>
                        {lignes.map((l) => (
                          <tr key={l.libelle} className="border-b border-slate-100">
                            <td className="py-2">
                              <div className="font-medium text-slate-700">{l.libelle}</div>
                              <div className="text-[10px] text-slate-400">{l.formule}</div>
                            </td>
                            <td className="py-2 text-right font-semibold text-[#1C2459]">{formatMAD(l.montant)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="py-2 font-bold text-[#1C2459]">Total solde de tout compte</td>
                          <td className="py-2 text-right font-bold text-[#149D92] text-sm">{formatMAD(calcul.totalSoldeToutCompte)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleImprimer('solde')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer le reçu pour solde de tout compte
                      </button>
                      {!lectureSeule && (
                        <button
                          onClick={() => {
                            majProcedure({ statut: 'cloturee', calculLicenciement: calcul });
                            setProcedureEnCours(null);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Clôturer la procédure
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {procedure && salarieActif && documentAImprimer && (
        <div className="bg-white p-10 text-sm leading-relaxed">
          <div className="mb-6 pb-4 border-b-2 border-slate-800">
            <div className="font-bold text-base">{entreprise.raisonSociale}</div>
            <div className="text-xs text-slate-600">{entreprise.siegeSocial}, {entreprise.ville}</div>
            <div className="text-xs text-slate-500">
              RC : {entreprise.registreCommerce} · Patente : {entreprise.patente} · CNSS : {entreprise.numeroCNSS} · ICE : {entreprise.ice}
            </div>
          </div>
          <div className="text-right text-xs mb-6">Fait à {entreprise.ville}, le {formatDateJJMMAAAA(new Date().toISOString())}</div>

          {documentAImprimer === 'convocation' && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Convocation à entretien préalable</h1>
              <p className="mb-4">Madame, Monsieur {salarieActif.nom} {salarieActif.prenom},</p>
              <p className="mb-4">
                Nous vous informons que les faits suivants, constatés le {formatDateJJMMAAAA(procedure.dateConstatation)}, nécessitent un
                entretien préalable conformément à l'article 62 du Code du Travail (Loi n° 65-99) : <em>{procedure.motifFaute}</em>
              </p>
              <p className="mb-4">
                Vous êtes convoqué(e) le {formatDateJJMMAAAA(procedure.dateConvocation!)} pour vous entretenir avec la direction sur ces faits.
                {procedure.assistanceDemandee && " Vous pourrez être assisté(e) d'un représentant des salariés ou d'un délégué syndical."}
              </p>
            </>
          )}

          {documentAImprimer === 'pv' && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Procès-verbal d'entretien préalable</h1>
              <p className="mb-4">
                Salarié : {salarieActif.nom} {salarieActif.prenom} ({salarieActif.matricule}) — Entretien du {formatDateJJMMAAAA(procedure.dateEntretien!)}
              </p>
              <p className="mb-4 whitespace-pre-wrap">{procedure.resumeEntretien}</p>
              <p className="mb-4">
                Signature :{' '}
                {procedure.signePar === 'les_deux' && 'Signé par les deux parties.'}
                {procedure.signePar === 'salarie_absent' && 'Le salarié ne s\'est pas présenté à l\'entretien.'}
                {procedure.signePar === 'refus_signature' && 'Le salarié a refusé de signer le présent procès-verbal.'}
              </p>
            </>
          )}

          {documentAImprimer === 'notification' && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Notification de sanction disciplinaire</h1>
              <p className="mb-4">Madame, Monsieur {salarieActif.nom} {salarieActif.prenom},</p>
              <p className="mb-4">
                À la suite de l'entretien préalable du {formatDateJJMMAAAA(procedure.dateEntretien!)}, nous vous notifions la décision
                suivante : <strong>{procedure.sanction === 'licenciement' ? 'Licenciement' : procedure.sanction}</strong>
                {procedure.sanction === 'mise_a_pied' && ` de ${procedure.joursMiseAPied} jour(s)`}.
              </p>
            </>
          )}

          {documentAImprimer === 'solde' && calculSolde && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Reçu pour solde de tout compte</h1>
              <p className="mb-4">Salarié : {salarieActif.nom} {salarieActif.prenom} ({salarieActif.matricule})</p>
              <table className="w-full text-sm mb-4">
                <tbody>
                  <tr><td className="py-1">Salaire prorata du mois de sortie</td><td className="py-1 text-right">{formatMAD(calculSolde.salaireProrataMoisSortie)}</td></tr>
                  <tr><td className="py-1">Prime d'ancienneté</td><td className="py-1 text-right">{formatMAD(calculSolde.primeAncienneteSolde)}</td></tr>
                  <tr><td className="py-1">Indemnité congés restants</td><td className="py-1 text-right">{formatMAD(calculSolde.indemniteCongesRestants)}</td></tr>
                  <tr><td className="py-1">Indemnité de licenciement</td><td className="py-1 text-right">{formatMAD(calculSolde.indemniteLicenciement)}</td></tr>
                  <tr><td className="py-1">Indemnité de préavis</td><td className="py-1 text-right">{formatMAD(calculSolde.indemnitePreavis)}</td></tr>
                  <tr><td className="py-1">Dommages-intérêts</td><td className="py-1 text-right">{formatMAD(calculSolde.dommagesInteretsAbusif)}</td></tr>
                  <tr><td className="py-1">Intérêts de retard</td><td className="py-1 text-right">{formatMAD(calculSolde.interetsRetard)}</td></tr>
                  <tr className="font-bold border-t-2 border-slate-800"><td className="py-2">Total</td><td className="py-2 text-right">{formatMAD(calculSolde.totalSoldeToutCompte)}</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-500">Document pédagogique — simulation OFPPT, ne constitue pas un reçu légalement opposable.</p>
            </>
          )}
        </div>
      )}

      {historiqueClos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-2">
          <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
            <History className="w-4 h-4 text-[#149D92]" />
            Procédures clôturées pour {salarieActif?.nom} {salarieActif?.prenom}
          </h2>
          <ul className="divide-y divide-slate-100 text-xs">
            {historiqueClos.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>
                  {p.typeFaute === 'grave' ? 'Faute grave' : 'Faute légère'} — {p.sanction} — constatée le {formatDateJJMMAAAA(p.dateConstatation)}
                </span>
                <button onClick={() => setProcedureEnCours(p)} className="text-[#149D92] font-semibold hover:underline">
                  Voir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
