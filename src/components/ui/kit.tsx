import React from 'react';

/**
 * Kit de composants — Design system « Marocain contemporain ».
 * Fondations réutilisables : surfaces, KPI, badges, titres, bandeau zellige, boutons.
 * Les écrans adoptent ces primitives progressivement (vitrine : tableau de bord formateur).
 */

type Tone = 'teal' | 'terracotta' | 'safran' | 'danger' | 'success' | 'navy' | 'neutral';

const TONE_HEX: Record<Tone, string> = {
  teal: '#149D92',
  terracotta: '#C96A4B',
  safran: '#E9A23B',
  danger: '#D64545',
  success: '#2E9E6B',
  navy: '#1C2459',
  neutral: '#64748b'
};

const TONE_SOFT: Record<Tone, string> = {
  teal: 'bg-[#E4F3F1] text-[#0F7D74]',
  terracotta: 'bg-[#F8EBE4] text-[#B4563B]',
  safran: 'bg-[#FBEFD8] text-[#B9801F]',
  danger: 'bg-rose-50 text-rose-700',
  success: 'bg-emerald-50 text-emerald-700',
  navy: 'bg-[#E7E9F2] text-[#1C2459]',
  neutral: 'bg-slate-100 text-slate-600'
};

/* ----------------------------------------------------------------- Carte */
export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { accent?: Tone; as?: 'div' }
> = ({ accent, className = '', style, children, ...rest }) => (
  <div
    className={`card-soft ${accent ? 'accent-top' : ''} ${className}`}
    style={accent ? ({ ['--accent' as any]: TONE_HEX[accent], ...style }) : style}
    {...rest}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------- KPI */
export const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: React.ReactNode;
  tone?: Tone;
  footer?: React.ReactNode;
  valueClassName?: string;
}> = ({ label, value, unit, icon, tone = 'teal', footer, valueClassName }) => (
  <Card accent={tone} className="p-5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${TONE_SOFT[tone]}`}>{icon}</div>
    </div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className={`font-display text-[1.75rem] leading-none font-semibold tabular-nums ${valueClassName ?? 'text-[#1C2459]'}`}>
        {value}
      </span>
      {unit && <span className="text-xs text-slate-500">{unit}</span>}
    </div>
    {footer && <div className="mt-2 text-[11px] text-slate-500">{footer}</div>}
  </Card>
);

/* ----------------------------------------------------------------- Badge */
export const Badge: React.FC<{ tone?: Tone; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  icon,
  children,
  className = ''
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TONE_SOFT[tone]} ${className}`}
  >
    {icon}
    {children}
  </span>
);

/* ---------------------------------------------------------- Titre section */
export const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }> = ({
  icon,
  title,
  subtitle,
  right
}) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div>
      <h2 className="font-display text-lg font-semibold text-[#1C2459] flex items-center gap-2">
        {icon && <span className="text-[#149D92]">{icon}</span>}
        {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {right}
  </div>
);

/* ------------------------------------------------------- Bandeau zellige */
export const ZelligeHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`bg-zellige rounded-2xl p-6 text-white shadow-sm ${className}`}
    style={{ background: 'linear-gradient(135deg, #1C2459 0%, #141A42 55%, #0F7D74 160%)' }}
  >
    {children}
  </div>
);

/* --------------------------------------------------------------- Boutons */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'onDark';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-[#149D92] hover:bg-[#11857c] text-white shadow-sm',
  secondary: 'bg-[#C96A4B] hover:bg-[#B4563B] text-white shadow-sm',
  ghost: 'bg-white border border-[#ECE3D6] hover:bg-[#FBF7F0] text-[#1C2459]',
  onDark: 'bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm'
};
export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: React.ReactNode }
> = ({ variant = 'primary', icon, children, className = '', ...rest }) => (
  <button
    className={`px-3.5 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 ${BTN[variant]} ${className}`}
    {...rest}
  >
    {icon}
    {children}
  </button>
);
