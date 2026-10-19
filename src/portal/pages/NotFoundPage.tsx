import React from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

export const NotFoundPage: React.FC = () => {
  useSeo({ titre: 'Page introuvable', description: "La page demandée n'existe pas." });
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-teal mb-4">404</p>
      <h1 className="font-display text-2xl font-bold text-navy mb-3">Page introuvable</h1>
      <p className="text-ink/65 mb-8">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="inline-flex items-center bg-navy text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-navy-deep transition-colors">
        Retour à l'accueil
      </Link>
    </div>
  );
};
