export function Card({ children, className = '', as: As = 'div' }) {
  return <As className={`card ${className}`}>{children}</As>;
}

export function CardHeader({ title, description, actions, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-night-800">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="mt-0.5 text-sm muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">{breadcrumb}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default Card;
