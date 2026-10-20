import React from 'react';
import {
  ArrowRight, LogIn, Download, Sparkles, Check,
  FileText, Users, CalendarCheck, Umbrella, Calculator, Receipt,
  Shield, Building2, Gavel, Briefcase, Folder, GraduationCap,
} from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { MENTION_COPYRIGHT } from '../../services/branding';

/**
 * Page d'accueil publique de SimulRH (simulrh.one).
 * Affichée avant l'authentification pour les visiteurs non connectés.
 * `onEntrer` bascule vers le formulaire de connexion / inscription (AuthGate).
 */

const NAVY = '#1C2459';
const TEAL = '#149D92';
const AMBER = '#E9A23B';

const serif = { fontFamily: '"Fraunces", Georgia, serif' } as const;

const MODULES: { icon: React.ComponentType<{ className?: string }>; titre: string; desc: string }[] = [
  { icon: FileText, titre: 'Contrats', desc: 'CDI, CDD, ANAPEC, intérim, stage… génération et suivi.' },
  { icon: Users, titre: 'Salariés', desc: 'Dossiers du personnel, affectations et historique.' },
  { icon: CalendarCheck, titre: 'Présences', desc: 'Pointage, heures travaillées et absences.' },
  { icon: Umbrella, titre: 'Congés', desc: 'Demandes, soldes et calendrier des absences.' },
  { icon: Calculator, titre: 'Moteur de paie', desc: 'Calcul déterministe : brut, CNSS, AMO, IR, CIMR.' },
  { icon: Receipt, titre: 'Bulletins', desc: 'Édition des bulletins et livre de paie en PDF.' },
  { icon: Shield, titre: 'CNSS & AMO', desc: 'Cotisations sociales et plafonds à jour.' },
  { icon: Building2, titre: 'Damancom', desc: 'Déclarations sociales dans le format marocain.' },
  { icon: Gavel, titre: 'Discipline', desc: 'Procédures et sanctions encadrées par le droit.' },
  { icon: Briefcase, titre: 'Missions', desc: "Scénarios d'apprentissage guidés et cas pratiques." },
  { icon: Folder, titre: 'Documents', desc: 'Attestations, certificats et pièces administratives.' },
  { icon: GraduationCap, titre: 'Dossier stagiaire', desc: 'Suivi de la progression par le formateur.' },
];

const ETAPES = [
  { n: '01', titre: 'Le formateur crée une classe', desc: 'Il ouvre un groupe et obtient un code à partager avec ses stagiaires.' },
  { n: '02', titre: 'Le stagiaire rejoint avec le code', desc: 'Inscription en un instant, puis accès à une entreprise fictive prête à l’emploi.' },
  { n: '03', titre: 'On pratique, pour de vrai', desc: 'Contrats, paie, déclarations : chaque action produit de vrais documents conformes.' },
];

const CHIPS = ['Code du travail marocain', 'CNSS', 'AMO', 'IR', 'CIMR', 'Damancom'];

export const LandingView: React.FC<{
  onEntrer: () => void;
  canInstall?: boolean;
  onInstaller?: () => void;
}> = ({ onEntrer, canInstall, onInstaller }) => {
  return (
    <div
      className="min-h-screen bg-[#FBF7F0] text-[#172B4D] overflow-x-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes slUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes slFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(-2deg); } }
        .sl-reveal { opacity: 0; animation: slUp .7s cubic-bezier(.2,.7,.2,1) both; }
        .sl-float { animation: slFloat 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .sl-reveal, .sl-float { animation: none; opacity: 1; } }
      `}</style>

      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FBF7F0]/80 border-b border-[#ECE3D6]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/portal/brand/logo-simulrh.png"
              alt="SIMULRH — Simulateur RH & Paie"
              className="h-9 w-auto shrink-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <a href="#modules" className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-[#1C2459] px-3 py-2">Modules</a>
            <a href="#demarche" className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-[#1C2459] px-3 py-2">Démarche</a>
            <button
              onClick={onEntrer}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white rounded-full px-4 py-2 transition-transform hover:-translate-y-0.5"
              style={{ background: NAVY }}
            >
              <LogIn className="w-4 h-4" /> Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative">
        {/* fond : maillages de couleur + grille discrète */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-20"
               style={{ background: `radial-gradient(circle, ${TEAL}, transparent 60%)` }} />
          <div className="absolute top-40 -left-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-[0.14]"
               style={{ background: `radial-gradient(circle, ${NAVY}, transparent 60%)` }} />
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: `linear-gradient(${NAVY} 1px, transparent 1px), linear-gradient(90deg, ${NAVY} 1px, transparent 1px)`, backgroundSize: '44px 44px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <div className="sl-reveal inline-flex items-center gap-2 rounded-full border border-[#E3D8C8] bg-white/70 px-3 py-1 text-xs font-semibold" style={{ color: TEAL }}>
              <Sparkles className="w-3.5 h-3.5" /> Plateforme pédagogique OFPPT
            </div>

            <h1 className="sl-reveal mt-5 text-[2.6rem] sm:text-6xl leading-[1.02] tracking-tight" style={{ ...serif, color: NAVY, animationDelay: '.06s' }}>
              Apprendre la paie<br />marocaine<span style={{ color: TEAL }}>.</span>
              <br />
              <span className="italic" style={{ color: TEAL }}>En la pratiquant.</span>
            </h1>

            <p className="sl-reveal mt-6 text-lg text-slate-600 max-w-xl" style={{ animationDelay: '.12s' }}>
              SimulRH plonge vos stagiaires dans une entreprise fictive : ils gèrent le personnel,
              établissent les contrats, lancent un moteur de paie conforme et produisent de vrais
              bulletins — du contrat jusqu'à la déclaration Damancom.
            </p>

            <div className="sl-reveal mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '.18s' }}>
              <button
                onClick={onEntrer}
                className="group inline-flex items-center gap-2 text-white font-semibold rounded-full px-6 py-3.5 shadow-lg shadow-[#1C2459]/20 transition-transform hover:-translate-y-0.5"
                style={{ background: NAVY }}
              >
                Accéder à l'application
                <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
              </button>
              {canInstall && (
                <button
                  onClick={onInstaller}
                  className="inline-flex items-center gap-2 font-semibold rounded-full px-5 py-3.5 border border-[#E3D8C8] bg-white hover:border-[#149D92] transition-colors"
                  style={{ color: NAVY }}
                >
                  <Download className="w-4.5 h-4.5" /> Installer l'app
                </button>
              )}
            </div>

            <div className="sl-reveal mt-9 flex flex-wrap gap-2" style={{ animationDelay: '.24s' }}>
              {CHIPS.map((c) => (
                <span key={c} className="text-xs font-medium text-slate-600 bg-white/70 border border-[#ECE3D6] rounded-full px-3 py-1">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Maquette de bulletin flottante */}
          <div className="sl-reveal relative" style={{ animationDelay: '.3s' }}>
            <div className="sl-float relative mx-auto max-w-sm bg-white rounded-2xl border border-[#ECE3D6] shadow-2xl shadow-[#1C2459]/10 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DD]">
                <div className="flex items-center gap-2">
                  <AppLogo size={26} />
                  <div className="text-[11px] font-bold" style={{ color: NAVY }}>Bulletin de paie</div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">SARL ATLAS</div>
              </div>
              <div className="mt-3 space-y-2 text-[12px]">
                {[
                  ['Salaire de base', '6 000,00'],
                  ['Prime d’ancienneté', '  300,00'],
                  ['CNSS (4,48 %)', '− 282,24'],
                  ['AMO (2,26 %)', '− 142,38'],
                  ['IR net', '− 487,60'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono text-slate-700">{v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#F0E9DD]">
                  <span className="font-semibold" style={{ color: NAVY }}>Net à payer</span>
                  <span className="font-mono font-bold text-base" style={{ color: TEAL }}>5 387,78</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: AMBER }}>
                <Check className="w-3.5 h-3.5" /> Calcul vérifié par le moteur
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MODULES ============ */}
      <section id="modules" className="relative max-w-6xl mx-auto px-5 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl tracking-tight" style={{ ...serif, color: NAVY }}>
            Toute la fonction RH, dans un seul atelier
          </h2>
          <p className="mt-3 text-slate-600">
            Douze modules couvrant le cycle complet, du recrutement à la déclaration sociale.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ icon: Icon, titre, desc }, i) => (
            <div
              key={titre}
              className="sl-reveal group bg-white rounded-xl border border-[#ECE3D6] p-5 hover:border-[#149D92] hover:shadow-lg hover:shadow-[#1C2459]/5 transition-all hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors"
                   style={{ background: `${TEAL}14` }}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-bold text-[15px]" style={{ color: NAVY }}>{titre}</div>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ DÉMARCHE ============ */}
      <section id="demarche" className="relative py-20" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl tracking-tight text-white" style={serif}>
            De la classe au bulletin, en trois temps
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {ETAPES.map((e, i) => (
              <div key={e.n} className="sl-reveal relative" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-5xl font-mono font-bold" style={{ color: `${TEAL}` }}>{e.n}</div>
                <div className="mt-3 text-xl font-bold text-white" style={serif}>{e.titre}</div>
                <p className="mt-2 text-slate-300/90 leading-relaxed">{e.desc}</p>
                {i < ETAPES.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-4 -right-5 w-6 h-6 text-white/25" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ POUR QUI ============ */}
      <section className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-6">
        {[
          { r: 'Formateurs', p: 'Pilotez une classe, suivez chaque dossier stagiaire et construisez vos cas pratiques.', icon: GraduationCap },
          { r: 'Stagiaires', p: 'Manipulez un vrai système RH-Paie sans risque, et ancrez la théorie par la pratique.', icon: Users },
        ].map(({ r, p, icon: Icon }) => (
          <div key={r} className="sl-reveal relative overflow-hidden bg-white rounded-2xl border border-[#ECE3D6] p-7">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10" style={{ background: TEAL }} />
            <Icon className="w-8 h-8" style={{ color: TEAL }} />
            <div className="mt-4 text-2xl font-bold" style={{ ...serif, color: NAVY }}>{r}</div>
            <p className="mt-2 text-slate-600">{p}</p>
          </div>
        ))}
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center"
             style={{ background: `linear-gradient(135deg, ${TEAL}, ${NAVY})` }}>
          <div className="absolute inset-0 opacity-[0.07]"
               style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <h2 className="relative text-3xl sm:text-5xl tracking-tight text-white" style={serif}>
            Prêt à ouvrir votre atelier RH&nbsp;?
          </h2>
          <p className="relative mt-4 text-white/80 max-w-xl mx-auto">
            Créez votre compte formateur ou rejoignez une classe avec votre code stagiaire.
          </p>
          <button
            onClick={onEntrer}
            className="relative mt-8 inline-flex items-center gap-2 bg-white font-semibold rounded-full px-7 py-4 shadow-xl transition-transform hover:-translate-y-0.5"
            style={{ color: NAVY }}
          >
            Commencer maintenant <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[#ECE3D6]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/portal/brand/logo-simulrh.png"
              alt="SIMULRH — Simulateur RH & Paie"
              className="h-8 w-auto shrink-0"
            />
          </div>
          <p className="text-[11px] text-slate-500 text-center">{MENTION_COPYRIGHT}</p>
          <button onClick={onEntrer} className="text-sm font-semibold hover:underline" style={{ color: NAVY }}>
            Se connecter →
          </button>
        </div>
      </footer>
    </div>
  );
};
