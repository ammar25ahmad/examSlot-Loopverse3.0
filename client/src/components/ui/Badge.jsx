export function Badge({ children, className = '', tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-200 text-slate-700 dark:bg-night-700 dark:text-slate-300',
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  };
  return <span className={`chip ${tones[tone] || tones.slate} ${className}`}>{children}</span>;
}

export function StatusBadge({ label, className = '' }) {
  return <span className={`chip ${className}`}>{label}</span>;
}

export default Badge;
