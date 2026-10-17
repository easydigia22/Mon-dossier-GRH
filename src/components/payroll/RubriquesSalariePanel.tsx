import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, Info, Users } from 'lucide-react';
import { RubriquePersonnalisee, Salarie, TypeRubriquePersonnalisee } from '../../types';
import { CATALOGUE_RUBRIQUES, LIBELLE_TYPE_RUBRIQUE } from '../../data/rubriquesCatalogue';
import { formatMAD } from '../../services/exportService';

interface RubriquesSalariePanelProps {
  salarie: Salarie;
  periode: string;
  rubriques: RubriquePersonnalisee[];
  onAjouter: (salarieId: string, periode: string, rubrique: RubriquePersonnalisee) => void;
  onSupprimer: (salarieId: string, periode: string, index: number) => void;
  onAppliquerCategorie: (categorie: string | null, periode: string, rubrique: RubriquePersonnalisee) => void;
  onFermer: () => void;
}

const TAG_STYLE: Record<TypeRubriquePersonnalisee, string> = {
  prime: 'bg-emerald-100 text-emerald-800',
  indemnite_exoneree: 'bg-sky-100 text-sky-800',
  avantage_nature: 'bg-amber-100 text-amber-800'
};

const TRAITEMENT: Record<TypeRubriquePersonnalisee, string> = {
  prime: 'Imposable · CNSS/AMO',
  indemnite_exoneree: 'Non imposable · Hors CNSS',
  avantage_nature: 'Réintégré assiette, déduit du net'
};

export const RubriquesSalariePanel: React.FC<RubriquesSalariePanelProps> = ({
  salarie,
  periode,
  rubriques,
  onAjouter,
  onSupprimer,
  onAppliquerCategorie,
  onFermer
}) => {
  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState<TypeRubriquePersonnalisee>('prime');
  const [montant, setMontant] = useState('');

  const categorie = salarie.qualification?.trim() || null;

  const construireRubrique = (): RubriquePersonnalisee | null => {
    const valeur = parseFloat(montant.replace(',', '.'));
    if (!libelle.trim() || isNaN(valeur) || valeur <= 0) return null;
    return { libelle: libelle.trim(), montant: valeur, type };
  };

  const reset = () => {
    setLibelle('');
    setMontant('');
    setType('prime');
  };

  const handleAjouter = () => {
    const rubrique = construireRubrique();
    if (!rubrique) return;
    onAjouter(salarie.id, periode, rubrique);
    reset();
  };

  const handleAppliquerCategorie = () => {
    const rubrique = construireRubrique();
    if (!rubrique) return;
    onAppliquerCategorie(categorie, periode, rubrique);
    reset();
  };

  // Sélection depuis le catalogue : pré-remplit le formulaire (montant modifiable).
  const handleCatalogue = (value: string) => {
    if (!value) return;
    for (const groupe of CATALOGUE_RUBRIQUES) {
      const trouve = groupe.rubriques.find((r) => r.libelle === value);
      if (trouve) {
        setLibelle(trouve.libelle);
        setType(trouve.type);
        if (trouve.montantSuggere) setMontant(String(trouve.montantSuggere));
        return;
      }
    }
  };

  const totalAffecte = useMemo(
    () => rubriques.reduce((sum, r) => sum + r.montant, 0),
    [rubriques]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onFermer}>
      <div
        className="bg-white border border-[#ECE3D6] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="bg-[#FBF7F0] border-b border-[#ECE3D6] px-5 py-4 flex items-center justify-between sticky top-0">
          <div>
            <div className="font-bold text-[#1C2459] text-[15px]">{salarie.nom} {salarie.prenom}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {salarie.matricule} · {salarie.poste}{categorie ? ` · Catégorie : ${categorie}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold bg-[#1C2459] text-white px-2 py-1 rounded">PÉRIODE {periode}</span>
            <button onClick={onFermer} className="text-slate-400 hover:text-slate-700" title="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Liste des rubriques appliquées */}
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
            Rubriques appliquées ce mois
          </div>
          {rubriques.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-3 border border-dashed border-slate-200 rounded-lg text-center">
              Aucune rubrique saisie pour ce salarié sur {periode}.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500">
                  <th className="text-left font-semibold py-1.5 px-2">Libellé</th>
                  <th className="text-left font-semibold py-1.5 px-2">Type</th>
                  <th className="text-left font-semibold py-1.5 px-2">Traitement</th>
                  <th className="text-right font-semibold py-1.5 px-2">Montant</th>
                  <th className="py-1.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rubriques.map((r, idx) => (
                  <tr key={`${r.libelle}-${idx}`}>
                    <td className="py-2 px-2 text-slate-800">{r.libelle}</td>
                    <td className="py-2 px-2">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${TAG_STYLE[r.type]}`}>
                        {LIBELLE_TYPE_RUBRIQUE[r.type]}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-[10px] text-slate-500">{TRAITEMENT[r.type]}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold">{formatMAD(r.montant)}</td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => onSupprimer(salarie.id, periode, idx)}
                        className="text-slate-300 hover:text-red-600"
                        title="Supprimer cette rubrique"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {rubriques.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-500 text-right">
              Total rubriques saisies : <strong className="text-[#1C2459]">{formatMAD(totalAffecte)}</strong>
            </div>
          )}

          {/* Ajout */}
          <div className="mt-5 border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
              Ajouter une rubrique
            </div>

            {/* Catalogue */}
            <label className="block text-[9.5px] uppercase tracking-wide text-slate-400 font-bold mb-1">
              Depuis le catalogue (traitement fiscal automatique)
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white mb-3"
              value=""
              onChange={(e) => handleCatalogue(e.target.value)}
            >
              <option value="">— Choisir une rubrique du catalogue —</option>
              {CATALOGUE_RUBRIQUES.map((groupe) => (
                <optgroup key={groupe.famille} label={groupe.famille}>
                  {groupe.rubriques.map((r) => (
                    <option key={r.libelle} value={r.libelle}>{r.libelle}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mb-3">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>— ou — saisie d'une rubrique personnalisée (le type choisi pilote le calcul du net) :</span>
            </div>

            {/* Saisie libre */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <div className="sm:col-span-3">
                <label className="block text-[9.5px] uppercase tracking-wide text-slate-400 font-bold mb-1">Libellé</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  placeholder="ex. Prime exceptionnelle de chantier"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9.5px] uppercase tracking-wide text-slate-400 font-bold mb-1">Type</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  value={type}
                  onChange={(e) => setType(e.target.value as TypeRubriquePersonnalisee)}
                >
                  <option value="prime">{LIBELLE_TYPE_RUBRIQUE.prime}</option>
                  <option value="indemnite_exoneree">{LIBELLE_TYPE_RUBRIQUE.indemnite_exoneree}</option>
                  <option value="avantage_nature">{LIBELLE_TYPE_RUBRIQUE.avantage_nature}</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[9.5px] uppercase tracking-wide text-slate-400 font-bold mb-1">Montant</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs tabular-nums"
                  placeholder="0,00"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={handleAjouter}
                className="px-3.5 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Ajouter la rubrique
              </button>
              <button
                onClick={handleAppliquerCategorie}
                disabled={!categorie}
                className="px-3.5 py-2 bg-white border border-slate-300 text-[#1C2459] text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title={categorie ? `Appliquer à tous les salariés « ${categorie} »` : 'Qualification du salarié non renseignée'}
              >
                <Users className="w-4 h-4" />
                {categorie ? `Appliquer à toute la catégorie « ${categorie} »` : 'Catégorie non définie'}
              </button>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 bg-[#FBF7F0] border border-[#ECE3D6] rounded-lg px-3 py-2">
            Après modification des rubriques, relancez <strong>« Calculer les bulletins »</strong> pour recalculer le brut, les cotisations et le net.
          </div>
        </div>
      </div>
    </div>
  );
};
