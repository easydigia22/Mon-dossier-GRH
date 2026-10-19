import React from 'react';
import { Mail, AlertTriangle } from 'lucide-react';
import { useSeo } from '../lib/seo';

const CONTACT_EMAIL = 'ezzouhir2122@gmail.com';

const Page: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <h1 className="font-display text-3xl font-bold text-navy mb-6">{titre}</h1>
    <div className="space-y-4 text-[15px] leading-relaxed text-ink/85">{children}</div>
  </div>
);

/** Encadré signalant une information à compléter avant publication. */
const ACompleter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="flex items-start gap-2 bg-safran-soft border border-[#E9A23B]/40 text-[#8a5a12] rounded-lg px-3 py-2 text-[13.5px]">
    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
    <span>{children}</span>
  </p>
);

export const AProposPage: React.FC = () => {
  useSeo({
    titre: 'À propos',
    description: 'SimulRH : portail pédagogique marocain dédié à la GRH, à la paie, au droit du travail et à la fiscalité.',
  });
  return (
    <Page titre="À propos de SimulRH">
      <p>
        SimulRH est un projet pédagogique consacré à la gestion des ressources humaines, à la paie,
        au droit du travail et à la fiscalité au Maroc. Il s'adresse aux étudiants, aux stagiaires de
        l'OFPPT, aux formateurs et aux professionnels RH, paie et comptabilité.
      </p>
      <p>
        Le portail rassemble des cours, des exercices corrigés et des QCM. Il s'accompagne d'une
        application de simulation permettant de s'exercer sur une entreprise fictive : contrats,
        présences, congés, moteur de paie et bulletins.
      </p>
      <ACompleter>
        L'identité de l'éditeur, le statut du projet et son éventuel rattachement institutionnel
        restent à préciser sur cette page avant publication.
      </ACompleter>
    </Page>
  );
};

export const ContactPage: React.FC = () => {
  useSeo({ titre: 'Contact', description: 'Contacter l’équipe de SimulRH.' });
  return (
    <Page titre="Contact">
      <p>Pour toute question ou suggestion concernant le portail, vous pouvez écrire par e-mail.</p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="inline-flex items-center gap-2 bg-navy text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-navy-deep transition-colors w-fit"
      >
        <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
      </a>
      <ACompleter>
        Un formulaire de contact nécessite un service d'envoi d'e-mails (à configurer en phase 2).
        En attendant, seul le lien e-mail ci-dessus est réellement opérationnel.
      </ACompleter>
    </Page>
  );
};

export const MentionsLegalesPage: React.FC = () => {
  useSeo({ titre: 'Mentions légales', description: 'Mentions légales du portail SimulRH.' });
  return (
    <Page titre="Mentions légales">
      <h2 className="font-display text-xl font-semibold text-navy pt-2">Éditeur</h2>
      <p>Le portail SimulRH est édité dans un cadre pédagogique.</p>
      <ACompleter>
        À compléter avant publication : raison sociale ou nom de l'éditeur, statut, adresse,
        responsable de la publication et moyen de contact officiel.
      </ACompleter>

      <h2 className="font-display text-xl font-semibold text-navy pt-2">Hébergement</h2>
      <p>Le site est hébergé par Vercel Inc.</p>
      <ACompleter>Vérifier et compléter les coordonnées complètes de l'hébergeur.</ACompleter>

      <h2 className="font-display text-xl font-semibold text-navy pt-2">Propriété intellectuelle</h2>
      <p>
        Les contenus du portail sont fournis à des fins pédagogiques. Les contenus de démonstration
        ne sont ni vérifiés ni contractuels.
      </p>
    </Page>
  );
};

export const ConfidentialitePage: React.FC = () => {
  useSeo({ titre: 'Confidentialité', description: 'Politique de confidentialité du portail SimulRH.' });
  return (
    <Page titre="Politique de confidentialité">
      <p>
        Cette page décrit la manière dont les données sont traitées sur le portail. Elle sera
        complétée au fur et à mesure de l'ajout des fonctionnalités.
      </p>

      <h2 className="font-display text-xl font-semibold text-navy pt-2">Partie publique du portail</h2>
      <p>
        La consultation des cours, exercices et QCM ne requiert pas de compte. Les réponses aux QCM
        sont calculées dans votre navigateur et ne sont pas transmises à un serveur.
      </p>

      <h2 className="font-display text-xl font-semibold text-navy pt-2">Application SimulRH</h2>
      <p>
        L'application (accessible via « L'application ») peut nécessiter un compte et stocker des
        données de travail. Les exemples utilisent des données fictives ; il est déconseillé d'y
        saisir des données personnelles réelles.
      </p>

      <ACompleter>
        À examiner avant publication : obligations de la loi 09-08 relative à la protection des
        données personnelles au Maroc et démarches éventuelles auprès de la CNDP. Aucune conformité
        ne doit être affirmée ici tant qu'elle n'a pas été vérifiée.
      </ACompleter>
    </Page>
  );
};
