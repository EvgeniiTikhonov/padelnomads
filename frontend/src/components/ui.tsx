import { type ReactNode, useEffect } from 'react';

/* Card -------------------------------------------------------------- */
export function Card({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return <As className={`border border-brand-black/10 bg-white ${className}`}>{children}</As>;
}

/* Badge ------------------------------------------------------------- */
type Tone = 'neutral' | 'live' | 'success' | 'warning' | 'danger' | 'muted';

const toneClasses: Record<Tone, string> = {
  neutral: 'border-brand-black/20 text-brand-black',
  live: 'border-transparent bg-brand-black text-brand-white',
  success: 'border-green-700/30 bg-green-50 text-green-800',
  warning: 'border-amber-600/30 bg-amber-50 text-amber-800',
  danger: 'border-red-700/30 bg-red-50 text-red-800',
  muted: 'border-brand-black/10 text-brand-black/50',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 font-heading text-[0.65rem] font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

/* Stat -------------------------------------------------------------- */
export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-black/50">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand-black">
        {value}
      </p>
      {hint && <p className="mt-1 font-body text-xs text-brand-black/50">{hint}</p>}
    </Card>
  );
}

/* Section title ----------------------------------------------------- */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="heading-section">{title}</h1>
        {subtitle && <p className="mt-2 font-body text-body text-brand-black/60">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* Empty state ------------------------------------------------------- */
export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Card className="p-10 text-center">
      <p className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-black">
        {title}
      </p>
      {message && <p className="mt-2 font-body text-sm text-brand-black/60">{message}</p>}
    </Card>
  );
}

/* Modal ------------------------------------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-black/40 p-4 sm:p-8">
      <div
        className={`relative my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} border border-brand-black/10 bg-brand-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-brand-black/10 px-6 py-4">
          <h2 className="heading-sub">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-heading text-xl leading-none text-brand-black/50 transition-colors hover:text-brand-black"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

/* Confirm ----------------------------------------------------------- */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="font-body text-body text-brand-black/80">{message}</p>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onCancel} className="btn-secondary !px-6 !py-3 !text-xs">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`btn-primary !px-6 !py-3 !text-xs ${danger ? '!bg-red-700 hover:!bg-red-800' : ''}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* Small helpers ----------------------------------------------------- */
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span className="text-brand-black/50"> *</span>}
      </label>
      {hint && <p className="form-hint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}
