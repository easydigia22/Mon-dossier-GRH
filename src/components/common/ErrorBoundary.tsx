import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Optionnel : libellé de la zone surveillée, affiché dans le message
   * (ex. « cette section »). Purement cosmétique.
   */
  zone?: string;
}

interface ErrorBoundaryState {
  erreur: Error | null;
}

/**
 * Filet de sécurité global : si une vue plante au rendu, on affiche un message
 * clair avec un bouton de récupération au lieu d'une page blanche (qui laissait
 * l'utilisateur bloqué sans explication). Le reste de l'application — notamment
 * le menu latéral — reste utilisable.
 *
 * Astuce d'usage : donner une `key` qui change avec l'onglet actif pour que la
 * navigation vers une autre section réinitialise automatiquement l'erreur.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { erreur: null };
  }

  static getDerivedStateFromError(erreur: Error): ErrorBoundaryState {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: React.ErrorInfo) {
    // Trace complète en console pour le diagnostic (visible via les outils dev).
    console.error('[ErrorBoundary] Une vue a planté :', erreur, info.componentStack);
  }

  private reessayer = () => {
    this.setState({ erreur: null });
  };

  render() {
    if (this.state.erreur) {
      return (
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1C2459]">Une erreur est survenue</h1>
          <p className="text-sm text-slate-600">
            {this.props.zone ? `${this.props.zone} ` : 'Cette section '}
            n'a pas pu s'afficher correctement. Vos données ne sont pas perdues. Vous pouvez
            réessayer, changer de section, ou recharger la page.
          </p>
          <p className="text-[11px] text-slate-400 font-mono break-words bg-slate-50 border border-slate-100 rounded p-2">
            {this.state.erreur.message}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={this.reessayer}
              className="px-3.5 py-2 text-xs font-semibold text-[#1C2459] bg-white border border-[#E3D8C8] hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réessayer</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
