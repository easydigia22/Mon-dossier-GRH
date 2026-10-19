import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Info, Scale, ShieldCheck, ArrowRight, Clock,
  GraduationCap, Server, Lock, FileText, ChevronRight, BookOpen, Users,
} from 'lucide-react';
import { useSeo } from '../lib/seo';
import { Reveal } from '../components/Reveal';

/* --------------------------------------------------------------------------
   Coordonnées officielles du portail (cadre pédagogique, sans entité commerciale).
-------------------------------------------------------------------------- */
const CONTACT_EMAIL = 'contact@easydigia.com';
const CONTACT_EMAIL_ALT = 'ezzouhir2122@gmail.com';
const TEL_AFFICHE = '+212 781 99 56 65';
const TEL_LIEN = '+212781995665';
const LOCALISATION = 'Maroc';
const DERNIERE_MAJ = '19 octobre 2026';

/* --------------------------------------------------------------------------
   En-tête de page : bandeau marine + motif zellige + fil d'Ariane.
-------------------------------------------------------------------------- */
const PageHero: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  titre: string;
  sous: string;
}> = ({ icon: Icone, eyebrow, titre, sous }) => (
  <header className="relative overflow-hidden bg-navy-deep text-white bg-zellige">
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14 relative">
      <nav className="flex items-center gap-1.5 text-[12.5px] text-white/55 mb-5" aria-label="Fil d'Ariane">
        <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white/80">{eyebrow}</span>
      </nav>
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
          <Icone className="w-6 h-6 text-white" />
        </span>
        <div>
          <h1 className="font-display text-3xl sm:text-[2.1rem] font-bold leading-tight">{titre}</h1>
          <p className="mt-2 text-white/70 text-[15px] leading-relaxed max-w-xl">{sous}</p>
        </div>
      </div>
    </div>
  </header>
);

const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
    <Reveal>
      <div className="space-y-5 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </Reveal>
  </div>
);

/** Bloc de section avec titre et contenu, carte douce. */
const Bloc: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  titre: string;
  children: React.ReactNode;
}> = ({ icon: Icone, titre, children }) => (
  <section className="card-soft p-5 sm:p-6">
    <h2 className="font-display text-lg font-semibold text-navy flex items-center gap-2 mb-3">
      {Icone && (
        <span className="w-8 h-8 rounded-lg bg-teal-soft text-teal flex items-center justify-center shrink-0">
          <Icone className="w-4 h-4" />
        </span>
      )}
      {titre}
    </h2>
    <div className="space-y-3 text-ink/80">{children}</div>
  </section>
);

/** Badge « dernière mise à jour ». */
const MajBadge: React.FC = () => (
  <p className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/55 bg-sand rounded-full px-3 py-1">
    <Clock className="w-3.5 h-3.5" /> Dernière mise à jour : {DERNIERE_MAJ}
  </p>
);

/* ==========================================================================
   À PROPOS
========================================================================== */
export const AProposPage: React.FC = () => {
  useSeo({
    titre: 'À propos',
    description: 'SimulRH : portail pédagogique marocain dédié à la GRH, à la paie, au droit du travail et à la fiscalité.',
  });
  return (
    <>
      <PageHero
        icon={GraduationCap}
        eyebrow="À propos"
        titre="À propos de SimulRH"
        sous="Un portail pédagogique marocain pour apprendre la GRH, la paie, le droit du travail et la fiscalité — et s'exercer en conditions réelles."
      />
      <Wrap>
        <Bloc icon={Info} titre="Notre mission">
          <p>
            SimulRH rend concret l'apprentissage de la fonction RH au Maroc. Le portail réunit des
            cours clairs, des exercices corrigés et des QCM, puis les prolonge par une application de
            simulation où l'on gère une entreprise fictive : contrats, présences, congés, moteur de
            paie et bulletins.
          </p>
          <p>
            L'objectif : passer de la théorie à la pratique, dans un cadre fidèle à la réglementation
            marocaine (CNSS, AMO, IR, CIMR, Code du travail).
          </p>
        </Bloc>

        <Bloc icon={Users} titre="À qui s'adresse le portail">
          <ul className="space-y-2">
            {[
              'Étudiants et stagiaires de l’OFPPT en gestion, comptabilité et RH',
              'Formateurs cherchant des supports et des cas pratiques prêts à l’emploi',
              'Professionnels RH, paie et comptabilité en montée en compétences',
              'Toute personne souhaitant comprendre la paie et le droit social marocains',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc icon={BookOpen} titre="Ce que vous y trouvez">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Cours contextualisés', 'Rédigés pour le cadre marocain, à jour des barèmes.'],
              ['Exercices corrigés', 'Des cas pratiques pour s’entraîner pas à pas.'],
              ['QCM d’auto-évaluation', 'Corrigés instantanément dans le navigateur.'],
              ['Simulation de paie', 'Une entreprise fictive pour manipuler sans risque.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl bg-sand/60 p-3.5">
                <p className="font-semibold text-navy text-[14px]">{t}</p>
                <p className="text-[13px] text-ink/70 mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </Bloc>

        <div className="rounded-2xl bg-navy-deep text-white p-6 bg-zellige relative overflow-hidden">
          <h2 className="font-display text-xl font-semibold mb-1.5">Prêt à passer à la pratique ?</h2>
          <p className="text-white/70 text-[14.5px] mb-4 max-w-lg">
            Explorez les rubriques ou lancez l'application de simulation pour vous exercer sur un cas réel.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/cours" className="inline-flex items-center gap-1.5 bg-white text-navy font-semibold rounded-lg px-4 py-2.5 text-[14px] hover:bg-white/90 transition-colors">
              Parcourir les cours <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="/app" className="inline-flex items-center gap-1.5 bg-white/10 ring-1 ring-white/20 text-white font-semibold rounded-lg px-4 py-2.5 text-[14px] hover:bg-white/15 transition-colors">
              Ouvrir l'application
            </a>
          </div>
        </div>

        <p className="text-[13px] text-ink/55">
          SimulRH est un projet pédagogique édité à titre individuel, sans but commercial. Voir les{' '}
          <Link to="/mentions-legales" className="text-teal font-medium hover:underline">mentions légales</Link>.
        </p>
      </Wrap>
    </>
  );
};

/* ==========================================================================
   CONTACT
========================================================================== */
export const ContactPage: React.FC = () => {
  useSeo({ titre: 'Contact', description: 'Contacter l’équipe de SimulRH : e-mail et téléphone.' });

  const moyens = [
    { icon: Mail, label: 'E-mail', valeur: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, note: 'Réponse sous 48 h ouvrées' },
    { icon: Phone, label: 'Téléphone', valeur: TEL_AFFICHE, href: `tel:${TEL_LIEN}`, note: 'Lun – Ven, 9h – 18h (GMT+1)' },
    { icon: MapPin, label: 'Localisation', valeur: LOCALISATION, href: undefined, note: 'Portail en ligne, à distance' },
  ];

  return (
    <>
      <PageHero
        icon={Mail}
        eyebrow="Contact"
        titre="Nous contacter"
        sous="Une question, une suggestion ou une erreur repérée dans un cours ? Écrivez-nous — chaque retour nous aide à améliorer le portail."
      />
      <Wrap>
        <div className="grid gap-4 sm:grid-cols-3">
          {moyens.map(({ icon: Icone, label, valeur, href, note }) => {
            const inner = (
              <>
                <span className="w-10 h-10 rounded-xl bg-teal-soft text-teal flex items-center justify-center mb-3">
                  <Icone className="w-5 h-5" />
                </span>
                <p className="text-[12px] uppercase tracking-wide text-ink/50 font-semibold">{label}</p>
                <p className="font-semibold text-navy text-[14.5px] mt-0.5 break-words">{valeur}</p>
                <p className="text-[12.5px] text-ink/55 mt-1">{note}</p>
              </>
            );
            return href ? (
              <a key={label} href={href} className="card-soft p-5 block hover:-translate-y-0.5 transition-transform">
                {inner}
              </a>
            ) : (
              <div key={label} className="card-soft p-5">{inner}</div>
            );
          })}
        </div>

        <Bloc icon={Info} titre="Avant d'écrire">
          <p>
            Pour un retour sur un contenu précis (cours, exercice, QCM), indiquez son titre et, si
            possible, le passage concerné : cela nous permet de corriger plus vite.
          </p>
          <p className="text-[13.5px] text-ink/70">
            Adresse secondaire :{' '}
            <a href={`mailto:${CONTACT_EMAIL_ALT}`} className="text-teal font-medium hover:underline">{CONTACT_EMAIL_ALT}</a>
          </p>
        </Bloc>

        <div className="flex items-start gap-2.5 rounded-xl bg-safran-soft border border-[#E9A23B]/40 text-[#8a5a12] px-4 py-3 text-[13.5px]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Un formulaire de contact en ligne sera ajouté ultérieurement. Pour l'instant, l'e-mail et
            le téléphone ci-dessus sont les moyens opérationnels.
          </span>
        </div>
      </Wrap>
    </>
  );
};

/* ==========================================================================
   MENTIONS LÉGALES
========================================================================== */
export const MentionsLegalesPage: React.FC = () => {
  useSeo({ titre: 'Mentions légales', description: 'Mentions légales du portail pédagogique SimulRH.' });
  return (
    <>
      <PageHero
        icon={Scale}
        eyebrow="Mentions légales"
        titre="Mentions légales"
        sous="Informations relatives à l'éditeur, à l'hébergement et aux conditions d'utilisation du portail SimulRH."
      />
      <Wrap>
        <MajBadge />

        <Bloc icon={GraduationCap} titre="Éditeur">
          <p>
            SimulRH est un <strong>projet pédagogique</strong> édité à titre individuel, dans un cadre
            de formation et sans but commercial. Il ne constitue pas une entité commerciale.
          </p>
          <ul className="space-y-1.5 text-[14px]">
            <li><span className="text-ink/55">Responsable de la publication :</span> EZZOUHIR El Mustapha</li>
            <li><span className="text-ink/55">Contact :</span>{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal font-medium hover:underline">{CONTACT_EMAIL}</a>
              {' · '}<a href={`tel:${TEL_LIEN}`} className="text-teal font-medium hover:underline">{TEL_AFFICHE}</a>
            </li>
            <li><span className="text-ink/55">Localisation :</span> {LOCALISATION}</li>
          </ul>
        </Bloc>

        <Bloc icon={Server} titre="Hébergement">
          <p>Le site est hébergé par :</p>
          <ul className="space-y-1.5 text-[14px]">
            <li><strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-teal font-medium hover:underline">vercel.com</a></li>
          </ul>
          <p className="text-[13.5px] text-ink/70">
            Les contenus éditoriaux sont servis via l'infrastructure <strong>Supabase</strong> (base de
            données et stockage). Ces prestataires peuvent conserver des journaux techniques
            (adresse IP, horodatage) nécessaires au fonctionnement et à la sécurité du service.
          </p>
        </Bloc>

        <Bloc icon={FileText} titre="Propriété intellectuelle">
          <p>
            Les contenus (cours, exercices, QCM) sont mis à disposition à des fins strictement
            pédagogiques. Toute reproduction à des fins commerciales est soumise à autorisation
            préalable de l'éditeur.
          </p>
          <p className="text-[13.5px] text-ink/70">
            Les photographies d'illustration proviennent de banques d'images libres de droits
            (Pexels). Les icônes sont issues de la bibliothèque Lucide (licence ISC).
          </p>
        </Bloc>

        <Bloc icon={ShieldCheck} titre="Limitation de responsabilité">
          <p>
            Les contenus ont une vocation pédagogique et d'illustration. Malgré le soin apporté à leur
            exactitude et à leur mise à jour, ils ne remplacent pas un conseil juridique, fiscal ou
            comptable professionnel. Les données de la partie « simulation » sont <strong>fictives</strong>
            {' '}et ne sont ni vérifiées ni contractuelles. L'éditeur ne saurait être tenu responsable
            d'une décision prise sur la seule base de ces contenus.
          </p>
        </Bloc>

        <p className="text-[13px] text-ink/55">
          Voir aussi la{' '}
          <Link to="/confidentialite" className="text-teal font-medium hover:underline">politique de confidentialité</Link>.
        </p>
      </Wrap>
    </>
  );
};

/* ==========================================================================
   CONFIDENTIALITÉ
========================================================================== */
export const ConfidentialitePage: React.FC = () => {
  useSeo({ titre: 'Confidentialité', description: 'Politique de confidentialité du portail SimulRH : données, cookies et droits.' });
  return (
    <>
      <PageHero
        icon={Lock}
        eyebrow="Confidentialité"
        titre="Politique de confidentialité"
        sous="Comment vos données sont traitées sur le portail SimulRH, et quels sont vos droits."
      />
      <Wrap>
        <MajBadge />

        <Bloc icon={BookOpen} titre="Partie publique du portail">
          <p>
            La consultation des cours, exercices et QCM <strong>ne requiert aucun compte</strong>. Les
            réponses aux QCM sont calculées localement dans votre navigateur et ne sont transmises à
            aucun serveur.
          </p>
          <p className="text-[13.5px] text-ink/70">
            Le portail n'utilise pas de cookies publicitaires ni de traceurs de profilage. Un cache
            local (technologie PWA) peut être enregistré par votre navigateur pour accélérer
            l'affichage et permettre une consultation hors ligne ; il reste sur votre appareil.
          </p>
        </Bloc>

        <Bloc icon={Server} titre="Données techniques">
          <p>
            Comme tout site, le portail s'appuie sur des hébergeurs (Vercel, Supabase) qui peuvent
            conserver des <strong>journaux techniques</strong> (adresse IP, type de navigateur,
            horodatage) à des fins de fonctionnement et de sécurité. Ces données ne sont pas utilisées
            pour vous identifier personnellement ni revendues.
          </p>
        </Bloc>

        <Bloc icon={Users} titre="Application SimulRH">
          <p>
            L'application (accessible via « L'application ») peut nécessiter un compte et stocker des
            données de travail liées à votre usage. Les exemples reposent sur des <strong>données
            fictives</strong> : il est déconseillé d'y saisir des données personnelles réelles.
          </p>
        </Bloc>

        <Bloc icon={ShieldCheck} titre="Vos droits">
          <p>
            Conformément à la loi marocaine <strong>09-08</strong> relative à la protection des
            personnes physiques à l'égard du traitement des données à caractère personnel, vous
            disposez d'un droit d'accès, de rectification et de suppression des données vous
            concernant.
          </p>
          <p>
            Pour exercer ces droits, écrivez à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal font-medium hover:underline">{CONTACT_EMAIL}</a>.
            Nous vous répondrons dans les meilleurs délais.
          </p>
          <div className="flex items-start gap-2.5 rounded-xl bg-safran-soft border border-[#E9A23B]/40 text-[#8a5a12] px-4 py-3 text-[13px] mt-1">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Cette politique sera précisée au fur et à mesure de l'ajout des fonctionnalités. Aucune
              déclaration de conformité auprès de la CNDP n'est affirmée tant qu'elle n'a pas été
              formellement effectuée.
            </span>
          </div>
        </Bloc>

        <p className="text-[13px] text-ink/55">
          Pour en savoir plus sur l'éditeur, consultez les{' '}
          <Link to="/mentions-legales" className="text-teal font-medium hover:underline">mentions légales</Link>.
        </p>
      </Wrap>
    </>
  );
};
