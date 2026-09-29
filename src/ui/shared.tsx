import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight, X, Info } from 'lucide-react';
import type { Tag as TagType } from '../core/types';
import { money } from './currency';
export { money, fullMoney } from './currency';
export const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
export const human = (s: string) =>
  s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
export interface Trace {
  label: string;
  value: number;
  tag?: TagType;
  formula?: string;
  format?: 'money' | 'percent' | 'number';
  source?: string;
  note?: string;
}
export const TraceContext = createContext<(trace: Trace) => void>(() => {});
export function Tag({ tag = 'COMPUTED' }: { tag?: TagType }) {
  return (
    <span className={`tag tag-${tag.toLowerCase()}`} data-provenance={tag}>
      {tag.toLowerCase()}
    </span>
  );
}
export function NumberValue({
  value,
  label,
  tag = 'COMPUTED',
  format = 'money',
  formula,
  source,
  note,
  className = '',
}: Trace & { className?: string }) {
  const show = useContext(TraceContext);
  return (
    <button
      className={`number-value ${className}`}
      data-provenance={tag}
      onClick={() => show({ value, label, tag, format, formula, source, note })}
      title={`Trace ${label}`}
    >
      <span>
        {format === 'money'
          ? money(value)
          : format === 'percent'
            ? percent(value)
            : value.toLocaleString('en-IN')}
      </span>
      <Tag tag={tag} />
    </button>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null),
    closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === 'Tab') {
        const fields = [
          ...(ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,select,summary,[tabindex="0"]',
          ) ?? []),
        ].filter((x) => x.getClientRects().length);
        const first = fields[0],
          last = fields.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      prior?.focus();
    };
  }, []);
  return (
    <div className="modal-overlay" onClick={close}>
      <section
        ref={ref}
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Close dialog" onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <Info size={16} />
      <span>{children}</span>
    </div>
  );
}
export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowUpRight size={14} />
    </button>
  );
}
const glossary: Record<string, string> = {
  ALE: 'Annualized Loss Expectancy: probability-weighted financial loss over a year.',
  EPSS: 'A machine-learned probability that a CVE will be exploited somewhere in the next thirty days.',
  CVE: 'A public identifier for a known software vulnerability.',
  KEV: 'CISA’s catalog of vulnerabilities observed being exploited in the wild.',
  CVSS: 'Technical severity, which does not by itself measure exploitation likelihood.',
  P90: 'The loss threshold that ninety percent of simulated outcomes do not exceed.',
  DAG: 'A directed dependency graph with no cycles; a prototype simplification.',
  'noisy-OR': 'A node can be compromised through its own entry probability or any active parent.',
  Stackelberg: 'A game where the defender commits first and the attacker adapts.',
  SSE: 'Strong Stackelberg Equilibrium: equal attacker choices break in the defender’s favor.',
  QUBO: 'A quadratic objective over binary choices, including budget penalties.',
  QAOA: 'A parameterized quantum circuit that searches a binary optimization landscape.',
  ROSI: 'Return on security investment: modeled loss avoided, minus cost, divided by cost.',
};
export function Term({ children }: { children: string }) {
  return <abbr title={glossary[children] ?? children}>{children}</abbr>;
}
