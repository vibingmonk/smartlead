import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, Bell, Check, CheckCircle2, Info, Lightbulb, Loader2, Send, Sparkles, X, Zap,
} from 'lucide-react';
import { SCENARIOS } from './data';
import { nextRunsIST } from './plan';
import { useStore } from './store';
import type { Chip, Gate, Msg, Where } from './types';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'soft'; size?: 'sm' | 'md' };
export function Button({ variant = 'primary', size = 'md', className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        variant === 'primary' && 'bg-primary text-white shadow-sm hover:bg-primary/90',
        variant === 'secondary' && 'border border-border bg-surface text-text hover:bg-surface-2',
        variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-text',
        variant === 'soft' && 'bg-primary-soft text-primary hover:bg-primary/15',
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ───────────── Gate badges (consistent everywhere) ─────────────
const GATES: Record<Gate, { label: string; cls: string }> = {
  auto: { label: 'Auto', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  'auto-draft': { label: 'Auto · draft', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  'auto-watch': { label: 'Auto · watch', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  'auto-undo': { label: 'Auto with undo', cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  'approval-send': { label: 'Needs approval · send', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  'approval-spend': { label: 'Needs approval · spend', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  'approval-fix': { label: 'Needs approval', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
};

export function GateBadge({ gate }: { gate: Gate }) {
  const g = GATES[gate];
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium', g.cls)}>
      {gate.startsWith('approval') ? <AlertTriangle size={11} /> : gate === 'auto-undo' ? <Zap size={11} /> : <Check size={11} />}
      {g.label}
    </span>
  );
}

export function SAAvatar({ size = 28 }: { size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center rounded-lg bg-primary-soft text-primary" style={{ width: size, height: size }}>
      <Sparkles size={size * 0.5} />
    </div>
  );
}

// ───────────── Streaming text (~20ms per word) ─────────────
export function StreamText({ text, animate, onDone }: { text: string; animate: boolean; onDone?: () => void }) {
  const words = text.split(' ');
  const [n, setN] = useState(animate ? 0 : words.length);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= words.length) {
        window.clearInterval(id);
        done.current?.();
      }
    }, 20);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{words.slice(0, n).join(' ')}</>;
}

// ───────────── Chips ─────────────
export function Chips({ chips, where }: { chips: Chip[]; where: Where }) {
  const runChip = useStore((s) => s.runChip);
  return (
    <div className="flex flex-wrap gap-2 animate-fade-up">
      {chips.map((c) => (
        <button
          key={c.label}
          onClick={() => runChip(c.action, where)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-primary transition hover:border-primary/50"
        >
          {c.label}
          <ArrowRight size={12} />
        </button>
      ))}
    </div>
  );
}

// ───────────── Option cards (single choice, one Continue) ─────────────
function OptionCards({ m }: { m: Msg }) {
  const b = useStore((s) => s.build);
  const setOption = useStore((s) => s.setOption);
  const submit = useStore((s) => s.submitOptions);
  if (!b.scenario) return null;
  const sc = SCENARIOS[b.scenario];
  const locked = !!m.submitted;
  return (
    <Card className="overflow-hidden animate-fade-up">
      {sc.questions.map((q, qi) => {
        const value = q.id === 'q1' ? b.q1 : b.tone;
        return (
          <div key={q.id} className={cx('p-3', qi > 0 && 'border-t border-border')}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{q.title}</div>
            <div className="space-y-1.5">
              {q.options.map((o) => {
                const sel = value === o.label;
                return (
                  <button
                    key={o.label}
                    disabled={locked}
                    onClick={() => setOption(q.id, o.label)}
                    className={cx(
                      'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition',
                      sel ? 'border-primary bg-primary-soft/60' : 'border-border hover:border-primary/40',
                      locked && !sel && 'opacity-40',
                    )}
                  >
                    <span className={cx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border', sel ? 'border-primary' : 'border-muted/50')}>
                      {sel && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{o.label}</span>
                      <span className="block text-xs text-muted">{o.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex justify-end border-t border-border bg-surface-2 px-3 py-2">
        <Button size="sm" onClick={submit} disabled={locked}>
          {locked ? <><Check size={14} /> Continued</> : <>Continue <ArrowRight size={14} /></>}
        </Button>
      </div>
    </Card>
  );
}

function Checklist({ m }: { m: Msg }) {
  const done = m.done ?? 0;
  return (
    <ul className="space-y-1.5 text-sm">
      {m.items!.map((it, i) => (
        <li key={it} className={cx('flex items-center gap-2', i > done && 'opacity-40')}>
          {i < done ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : i === done ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <span className="h-4 w-4 rounded-full border border-border" />
          )}
          {it}
        </li>
      ))}
    </ul>
  );
}

// ───────────── "When this happens → Then do this" automation card ─────────────
export function AutomationCard({ m, where }: { m: Msg; where: Where }) {
  const turnOn = useStore((s) => s.turnOnAutomation);
  const toggleSlack = useStore((s) => s.toggleSlack);
  const runs = useRef(nextRunsIST()).current;
  return (
    <Card className="overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bell size={14} className="text-primary" /> {m.client} · reply rate watch
        </div>
        <GateBadge gate="auto-watch" />
      </div>
      <div className="canvas-dots space-y-0 px-4 py-4">
        <FlowStep tag="When this happens" tagCls="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          Reply rate on any {m.client} campaign is below <b>2%</b> over 3 days
        </FlowStep>
        <Connector />
        <FlowStep tag="Then do this" tagCls="bg-primary-soft text-primary">
          <div>Alert me in-app and by email, and propose a fix</div>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
            <Toggle on={!!m.slack} onClick={() => toggleSlack(where, m.id)} /> Also post to Slack
          </label>
        </FlowStep>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-surface-2 px-3 py-2">
        <div className="text-xs text-muted">Runs every hour · next at {runs}</div>
        <Button size="sm" disabled={m.on} onClick={() => turnOn(where, m.id)}>
          {m.on ? <><Check size={14} /> On</> : 'Turn on'}
        </Button>
      </div>
    </Card>
  );
}

export function FlowStep({ tag, tagCls, children }: { tag: string; tagCls: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cx('mb-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', tagCls)}>{tag}</span>
      <div className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm shadow-sm">{children}</div>
    </div>
  );
}

export function Connector({ short }: { short?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cx('w-px bg-muted/40', short ? 'h-4' : 'h-6')} />
      <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-muted/50" />
    </div>
  );
}

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('relative h-4 w-7 shrink-0 rounded-full transition', on ? 'bg-primary' : 'bg-muted/30')}
    >
      <span className={cx('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition', on ? 'left-3.5' : 'left-0.5')} />
    </button>
  );
}

function InsightCard({ m }: { m: Msg }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm animate-fade-up">
      <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
      <div>{m.body}</div>
    </div>
  );
}

// ───────────── Chat thread (shared by Build view and SA panel) ─────────────
function MsgView({ m, where }: { m: Msg; where: Where }) {
  const markStreamed = useStore((s) => s.markStreamed);
  if (m.role === 'user')
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{m.text}</div>
      </div>
    );
  const done = !!m.streamed;
  return (
    <div className="flex gap-2.5 animate-fade-up">
      <SAAvatar />
      <div className="min-w-0 flex-1 space-y-3 pt-1">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          <StreamText text={m.text} animate={!done} onDone={() => markStreamed(where, m.id)} />
        </div>
        {done && m.kind === 'options' && <OptionCards m={m} />}
        {done && m.kind === 'checklist' && <Checklist m={m} />}
        {done && m.kind === 'automation' && <AutomationCard m={m} where={where} />}
        {done && m.kind === 'insight' && <InsightCard m={m} />}
        {done && m.chips && <Chips chips={m.chips} where={where} />}
      </div>
    </div>
  );
}

export function ChatThread({ msgs, where }: { msgs: Msg[]; where: Where }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = msgs[msgs.length - 1];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = window.setInterval(() => (el.scrollTop = el.scrollHeight), 60);
    const stop = window.setTimeout(() => window.clearInterval(id), 2500);
    return () => (window.clearInterval(id), window.clearTimeout(stop));
  }, [msgs.length, last?.streamed, last?.done]);
  return (
    <div ref={ref} className="scroll-thin flex-1 space-y-5 overflow-y-auto px-5 py-5">
      {msgs.map((m) => (
        <MsgView key={m.id} m={m} where={where} />
      ))}
    </div>
  );
}

export function Composer({ onSend, placeholder, id, initial = '' }: { onSend: (t: string) => void; placeholder: string; id?: string; initial?: string }) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  const send = () => {
    const t = v.trim();
    if (!t) return;
    onSend(t);
    setV('');
  };
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-surface px-3 py-2 focus-within:border-primary/60">
        <textarea
          id={id}
          rows={2}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button onClick={send} className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white hover:bg-primary/90">
          <Send size={14} />
        </button>
      </div>
      <div className="mt-1.5 text-center text-[11px] text-muted">Enter to send · Shift+Enter for a new line · Scripted demo responses</div>
    </div>
  );
}

// ───────────── Modal & toasts ─────────────
export function Modal({ open, onClose, title, children, width = 'max-w-md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[1px]" onClick={onClose}>
      <div className={cx('w-full rounded-2xl border border-border bg-surface shadow-2xl animate-fade-up', width)} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-surface-2">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-5 top-[76px] z-[60] flex w-[360px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg animate-slide-in',
            t.tone === 'warn' ? 'border-amber-500/40' : t.tone === 'success' ? 'border-emerald-500/40' : 'border-border',
          )}
        >
          {t.tone === 'warn' ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          ) : t.tone === 'success' ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
          )}
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone }: { value: number; tone: 'green' | 'amber' | 'purple' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border">
      <div
        className={cx('h-full rounded-full transition-all duration-700', tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-primary')}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}
