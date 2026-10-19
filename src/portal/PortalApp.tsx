import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PortalLayout } from './components/PortalLayout';
import { HomePage } from './pages/HomePage';
import { RubriquePage } from './pages/RubriquePage';
import { CataloguePage } from './pages/CataloguePage';
import { ContenuPage } from './pages/ContenuPage';
import { QcmPage } from './pages/QcmPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AProposPage, ContactPage, MentionsLegalesPage, ConfidentialitePage } from './pages/StaticPages';
import { AdminContenusPage } from './admin/AdminContenusPage';

// L'application existante (simulateur) est chargée à la demande : les visiteurs
// du portail ne téléchargent pas son code tant qu'ils n'ouvrent pas /app.
const LegacyApp = lazy(() => import('./LegacyAppMount').then((m) => ({ default: m.LegacyAppMount })));

/** Replace le défilement en haut à chaque navigation. */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  // Corps en bloc OBLIGATOIRE : une flèche à retour implicite renverrait la
  // valeur de window.scrollTo(), que React 19 prend pour une fonction de
  // nettoyage et rappelle à la navigation suivante → « destroy is not a
  // function » et page blanche. On ne retourne donc rien.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Chargement: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <Loader2 className="w-6 h-6 animate-spin text-navy" />
  </div>
);

export const PortalApp: React.FC = () => (
  <>
    <ScrollToTop />
    <Routes>
      {/* Application existante, servie telle quelle sous /app (auth inchangée). */}
      <Route path="/app/*" element={<Suspense fallback={<Chargement />}><LegacyApp /></Suspense>} />

      {/* Portail public */}
      <Route element={<PortalLayout />}>
        <Route index element={<HomePage />} />

        <Route path="grh" element={<RubriquePage rubrique="grh" />} />
        <Route path="paie" element={<RubriquePage rubrique="paie" />} />
        <Route path="droit-du-travail" element={<RubriquePage rubrique="droit-du-travail" />} />
        <Route path="fiscalite" element={<RubriquePage rubrique="fiscalite" />} />
        <Route path="ofppt" element={<RubriquePage rubrique="ofppt" />} />

        <Route path="cours" element={<CataloguePage type="cours" titre="Cours" description="Parcours de cours par sujet, niveau et public." />} />
        <Route path="cours/:slug" element={<ContenuPage typeAttendu="cours" />} />

        <Route path="exercices" element={<CataloguePage type="exercice" titre="Exercices" description="Exercices avec corrections expliquées." />} />
        <Route path="exercices/:slug" element={<ContenuPage typeAttendu="exercice" />} />

        <Route path="qcm" element={<CataloguePage type="qcm" titre="QCM" description="Questionnaires avec score et explications." />} />
        <Route path="qcm/:slug" element={<QcmPage />} />

        <Route path="actualites" element={<RubriquePage rubrique="actualites" />} />
        <Route path="actualites/:slug" element={<ContenuPage typeAttendu="article" />} />

        <Route path="ressources" element={<RubriquePage rubrique="ressources" />} />
        <Route path="ressources/:slug" element={<ContenuPage typeAttendu="ressource" />} />

        <Route path="recherche" element={<CataloguePage titre="Recherche" description="Rechercher dans l'ensemble des contenus du portail." />} />

        <Route path="a-propos" element={<AProposPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="confidentialite" element={<ConfidentialitePage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </>
);
