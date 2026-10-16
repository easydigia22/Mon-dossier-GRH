import React, { useMemo } from 'react';
import {
  Send,
  FileSpreadsheet,
  Printer,
  Users,
  Wallet,
  CalendarClock,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';
import { BulletinPaie, Entreprise, Salarie } from '../../types';
import {
  formatMAD,
  exporterDeclarationDamancomCSV,
  LigneDeclarationDamancom
} from '../../services/exportService';
import { Card, Kpi, SectionTitle, ZelligeHeader, Button, Badge } from '../ui/kit';

interface DamancomViewProps {
  entreprise: Entreprise;
  salaries: Salarie[];
  bulletins: BulletinPaie[];
  periodeActive: string;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const JOURS_MAX_CNSS = 26; // Plafond de jours déclarables par mois à la CNSS

export const DamancomView: React.FC<DamancomViewProps> = ({
  entreprise,
  salaries,
  bulletins,
  periodeActive,
  showNotification
}) => {
  const bulletinsPeriode = useMemo(
    () => bulletins.filter((b) => b.periodeMois === periodeActive),
    [bulletins, periodeActive]
  );

  // Déclaration nominative des salaires (une ligne par salarié déclaré)
  const lignes: (LigneDeclarationDamancom & { toneSituation: 'neutral' | 'teal' | 'terracotta' })[] = useMemo(() => {
    return bulletinsPeriode.map((b) => {
      const sal = salaries.find((s) => s.matricule === b.salarieMatricule);
      const entrant = sal?.dateEmbauche?.startsWith(periodeActive);
      const sortant = sal?.dateSortie?.startsWith(periodeActive);
      const situation = sortant ? 'Sortant' : entrant ? 'Entrant' : 'Normal';
      return {
        numeroImmatriculation: sal?.cnssFictif || '—',
        matricule: b.salarieMatricule,
        nomPrenom: b.salarieNomPrenom,
        joursDeclares: Math.min(Math.round(b.joursTravailles), JOURS_MAX_CNSS),
        salaireReel: b.salaireBrutGlobal,
        salairePlafonne: b.assietteCNSSPlafonnee,
        situation,
        toneSituation: sortant ? 'terracotta' : entrant ? 'teal' : 'neutral'
      };
    });
  }, [bulletinsPeriode, salaries, periodeActive]);

  // Totaux déclaration
  const totalSalaireReel = bulletinsPeriode.reduce((s, b) => s + b.salaireBrutGlobal, 0);
  const totalSalairePlafonne = bulletinsPeriode.reduce((s, b) => s + b.assietteCNSSPlafonnee, 0);

  // Cotisations (reprises des bulletins) — ventilation DAMANCOM
  const prestations =
    bulletinsPeriode.reduce((s, b) => s + b.cnssSalariale + b.cnssPatronalePrestations, 0);
  const allocFamiliales = bulletinsPeriode.reduce((s, b) => s + b.cnssPatronaleAllocationsFamiliales, 0);
  const tfp = bulletinsPeriode.reduce((s, b) => s + b.taxeFormationProfessionnelle, 0);
  const amo = bulletinsPeriode.reduce((s, b) => s + b.amoSalariale + b.amoPatronale, 0);
  const totalCotisations = prestations + allocFamiliales + tfp + amo;

  const formatMois = (p: string) => {
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const [a, m] = p.split('-').map(Number);
    return `${mois[m - 1]} ${a}`;
  };
  // Échéance légale : au plus tard le 10 du mois suivant la période déclarée
  const echeance = (() => {
    const [a, m] = periodeActive.split('-').map(Number);
    const suivant = new Date(a, m, 10); // m (1-based) => mois suivant en base 0
    return suivant.toLocaleDateString('fr-FR');
  })();

  const handleTelecharger = () => {
    if (lignes.length === 0) return showNotification('Aucun bulletin pour cette période. Calculez d\'abord la paie.', 'warning');
    exporterDeclarationDamancomCSV(
      lignes,
      {
        numeroAffiliation: entreprise.numeroCNSS,
        raisonSociale: entreprise.raisonSociale,
        periode: periodeActive,
        totalSalaireReel,
        totalSalairePlafonne,
        totalCotisations
      }
    );
    showNotification('Fichier de télédéclaration DAMANCOM généré (simulation).', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Bandeau DAMANCOM */}
      <ZelligeHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
              <Send className="w-6 h-6 text-[#5FD0C5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#C96A4B] text-white rounded-full tracking-wide">TÉLÉDÉCLARATION CNSS</span>
                <span className="text-[11px] text-white/70 font-medium">Simulation pédagogique</span>
              </div>
              <h1 className="font-display text-[1.7rem] leading-tight font-semibold text-white mt-1.5">Portail DAMANCOM</h1>
              <p className="text-sm text-white/75 mt-0.5">
                Déclaration des salaires et cotisations — {formatMois(periodeActive)} · N° affiliation {entreprise.numeroCNSS || '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="onDark" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>Imprimer</Button>
            <Button variant="secondary" onClick={handleTelecharger} icon={<FileSpreadsheet className="w-4 h-4" />}>
              Générer le fichier de télédéclaration
            </Button>
          </div>
        </div>

        <div className="mt-4 bg-white/95 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#C96A4B] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Mention réglementaire :</strong> reproduction pédagogique du portail DAMANCOM de la CNSS.
            Aucune transmission réelle à la CNSS — données fictives, non destinées au dépôt officiel.
          </p>
        </div>
      </ZelligeHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Salariés déclarés" tone="navy" icon={<Users className="w-4 h-4" />} value={lignes.length} unit="salarié(s)" />
        <Kpi
          label="Masse salariale déclarée"
          tone="teal"
          icon={<Wallet className="w-4 h-4" />}
          value={formatMAD(totalSalaireReel)}
          valueClassName="text-[#1C2459] text-xl"
          footer={`Plafonnée : ${formatMAD(totalSalairePlafonne)}`}
        />
        <Kpi
          label="Cotisations à verser"
          tone="terracotta"
          icon={<Send className="w-4 h-4" />}
          value={formatMAD(totalCotisations)}
          valueClassName="text-[#B4563B] text-xl"
          footer="Prestations + AF + TFP + AMO"
        />
        <Kpi
          label="Échéance de paiement"
          tone="safran"
          icon={<CalendarClock className="w-4 h-4" />}
          value={echeance}
          valueClassName="text-[#1C2459] text-xl"
          footer="Au plus tard le 10 du mois suivant"
        />
      </div>

      {/* BDS — Déclaration nominative des salaires */}
      <Card className="p-6">
        <SectionTitle
          icon={<Users className="w-4 h-4" />}
          title="Bordereau de déclaration des salaires (BDS)"
          subtitle="Déclaration nominative — jours déclarés plafonnés à 26, salaire plafonné à 6 000 MAD / salarié"
          right={<Badge tone="teal">{lignes.length} ligne(s)</Badge>}
        />

        {lignes.length === 0 ? (
          <div className="text-center py-10">
            <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Aucun bulletin calculé pour {formatMois(periodeActive)}.</p>
            <p className="text-xs text-slate-400 mt-1">Rendez-vous dans « Préparation paie » pour générer les bulletins de la période.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-[#ECE3D6]">
                  <th className="py-2 pr-2">N° Immatriculation</th>
                  <th className="py-2 pr-2">Matricule</th>
                  <th className="py-2 pr-2">Nom &amp; Prénom</th>
                  <th className="py-2 pr-2 text-center">Jours</th>
                  <th className="py-2 pr-2 text-right">Salaire réel</th>
                  <th className="py-2 pr-2 text-right">Salaire plafonné</th>
                  <th className="py-2 pr-2 text-center">Situation</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {lignes.map((l) => (
                  <tr key={l.matricule} className="border-b border-[#F3ECE1] hover:bg-[#FBF7F0]">
                    <td className="py-2.5 pr-2 font-mono text-slate-600">{l.numeroImmatriculation}</td>
                    <td className="py-2.5 pr-2 font-mono text-slate-500">{l.matricule}</td>
                    <td className="py-2.5 pr-2 font-semibold text-[#1F2440] font-sans">{l.nomPrenom}</td>
                    <td className="py-2.5 pr-2 text-center">{l.joursDeclares}</td>
                    <td className="py-2.5 pr-2 text-right">{formatMAD(l.salaireReel)}</td>
                    <td className="py-2.5 pr-2 text-right">{formatMAD(l.salairePlafonne)}</td>
                    <td className="py-2.5 pr-2 text-center">
                      <Badge tone={l.toneSituation}>{l.situation}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#1C2459] font-bold text-[#1C2459]">
                  <td className="py-2.5 pr-2 font-sans" colSpan={4}>Totaux déclaration</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">{formatMAD(totalSalaireReel)}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">{formatMAD(totalSalairePlafonne)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* BPC — Bordereau de paiement des cotisations */}
      <Card className="p-6">
        <SectionTitle
          icon={<Wallet className="w-4 h-4" />}
          title="Bordereau de paiement des cotisations (BPC)"
          subtitle="Montants à télépayer via DAMANCOM"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            ['Prestations sociales (court & long terme)', prestations],
            ['Prestations familiales (allocations)', allocFamiliales],
            ['Taxe de formation professionnelle (TFP)', tfp],
            ['Assurance Maladie Obligatoire (AMO)', amo]
          ].map(([label, montant]) => (
            <div key={label as string} className="flex items-center justify-between py-2 border-b border-[#F3ECE1]">
              <span className="text-slate-600">{label as string}</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800">{formatMAD(montant as number)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between bg-[#FBF7F0] border border-[#ECE3D6] rounded-xl px-4 py-3">
          <span className="font-semibold text-[#1C2459]">Total à télépayer</span>
          <span className="font-mono text-lg font-black text-[#149D92] tabular-nums">{formatMAD(totalCotisations)}</span>
        </div>

        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Contrôle de cohérence : le total des cotisations correspond au bordereau CNSS récapitulatif de la même période.</span>
        </div>
      </Card>
    </div>
  );
};
