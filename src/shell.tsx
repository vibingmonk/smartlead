import { useEffect, useRef, useState } from 'react';
import {
  Activity, Bot, ChevronDown, FlaskConical, Home, Inbox, Lock, Mail, Moon, RotateCcw, Send, Settings, Sparkles, Sun,
  Target, Undo2, X, Zap,
} from 'lucide-react';
import { AGENCY, CLIENTS } from './data';
import { openCount, useStore } from './store';
import type { Autonomy, Page } from './types';
import { Button, ChatThread, Composer, Modal, cx } from './ui';

// ───────────── Top bar (SmartLead navy) ─────────────
export function TopBar() {
  const s = useStore();
  const needs = openCount(s.actions);
  const [workOpen, setWorkOpen] = useState(false);
  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-4 bg-nav px-5 text-white">
      <button onClick={() => s.go('home')} className="flex items-center gap-2">
        <span className="text-[18px] font-bold tracking-tight">SmartLead</span>
      </button>
      <span className="rounded-md border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
        Prototype · mock data
      </span>
      <div className="mx-2 h-5 w-px bg-white/15" />
      <label className="flex items-center gap-2 text-xs text-white/70">
        Client
        <span className="relative">
          <select
            value={s.client}
            onChange={(e) => s.setClient(e.target.value)}
            className="appearance-none rounded-md border border-white/20 bg-white/10 py-1 pl-2.5 pr-7 text-xs font-medium text-white outline-none hover:bg-white/15"
          >
            <option className="text-black">All clients</option>
            {CLIENTS.map((c) => (
              <option key={c} className="text-black">{c}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
        </span>
      </label>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setWorkOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Active SA work: <b className="tabular-nums">{s.work.length}</b> running
          </button>
          {workOpen && <WorkPopover onClose={() => setWorkOpen(false)} />}
        </div>
        <button
          onClick={() => s.go('actions')}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10"
        >
          <Zap size={14} /> Action center
          {needs > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-black">{needs}</span>}
        </button>
        <button
          onClick={() => (s.saOpen ? s.closeSA() : s.openSA())}
          className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/90"
        >
          <Sparkles size={14} /> Ask SA <kbd className="ml-1 rounded bg-nav/10 px-1 text-[10px] font-medium text-nav">⌘K</kbd>
        </button>
        <button onClick={s.toggleTheme} className="rounded-md p-2 text-white/80 hover:bg-white/10" title="Toggle theme">
          {s.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button onClick={() => s.setAutonomyOpen(true)} className="rounded-md p-2 text-white/80 hover:bg-white/10" title="What SA can do alone">
          <Settings size={16} />
        </button>
        <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-400 text-xs font-bold">NG</div>
      </div>
    </header>
  );
}

function WorkPopover({ onClose }: { onClose: () => void }) {
  const work = useStore((s) => s.work);
  const undo = useStore((s) => s.undoWork);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    window.setTimeout(() => document.addEventListener('click', h));
    return () => document.removeEventListener('click', h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 top-10 w-[380px] rounded-xl border border-border bg-surface text-text shadow-2xl animate-fade-up">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">Active SA work · {work.length} running</div>
        <div className="mt-0.5 text-xs text-muted">Counts work in use, not chat. Anything undone or paused drops out.</div>
      </div>
      <ul className="scroll-thin max-h-80 overflow-y-auto py-1">
        {work.map((w) => (
          <li key={w.id} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2">
            <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', w.kind === 'campaign' ? 'bg-primary' : w.kind === 'watch' ? 'bg-sky-500' : 'bg-emerald-500')} />
            <span className="flex-1">{w.label}</span>
            <button onClick={() => undo(w.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-border/60 hover:text-text">
              <Undo2 size={12} /> Undo
            </button>
          </li>
        ))}
        {work.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nothing running.</li>}
      </ul>
    </div>
  );
}

// ───────────── Left nav ─────────────
const NAV: { page: Page; label: string; icon: typeof Home }[] = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'goals', label: 'Goals', icon: Target },
  { page: 'campaigns', label: 'Campaigns', icon: Send },
  { page: 'accounts', label: 'Email accounts', icon: Mail },
  { page: 'actions', label: 'Action center', icon: Inbox },
  { page: 'agents', label: 'Agents', icon: Bot },
];

export function SideNav() {
  const page = useStore((s) => s.page);
  const go = useStore((s) => s.go);
  const needs = useStore((s) => openCount(s.actions));
  return (
    <nav className="flex w-[216px] shrink-0 flex-col border-r border-border bg-surface px-3 py-4">
      <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{AGENCY}</div>
      {NAV.map(({ page: p, label, icon: Icon }) => {
        const active = page === p || (p === 'home' && page === 'build');
        return (
          <button
            key={p}
            onClick={() => go(p)}
            className={cx(
              'mb-0.5 flex items-center gap-3 rounded-lg px-2.5 py-2 text-[15px] transition',
              active ? 'bg-primary-soft font-semibold text-primary' : 'text-text/85 hover:bg-surface-2 hover:text-text',
            )}
          >
            <Icon size={18} className={active ? 'text-primary' : 'text-muted'} />
            {label}
            {p === 'actions' && needs > 0 && (
              <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{needs}</span>
            )}
          </button>
        );
      })}
      <div className="mt-auto rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-text">
          <Activity size={13} className="text-primary" /> SA is semi-autonomous
        </div>
        It drafts and prepares on its own. Anything that sends or spends waits for you.
      </div>
    </nav>
  );
}

// ───────────── SA side panel ─────────────
export function SAPanel() {
  const s = useStore();
  if (!s.saOpen || s.page === 'build') return null;
  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-border bg-surface animate-slide-in">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
          <Sparkles size={14} />
        </div>
        <div className="text-sm font-semibold">Smart Assistant</div>
        <button onClick={s.closeSA} className="ml-auto rounded-md p-1 text-muted hover:bg-surface-2">
          <X size={16} />
        </button>
      </div>
      <ChatThread msgs={s.saMsgs} where="sa" />
      <Composer onSend={s.saSend} placeholder="Describe an outcome, or ask SA to watch something…" initial={s.saDraft} />
    </aside>
  );
}

// ───────────── Demo controls (press D) ─────────────
export function DemoPanel() {
  const s = useStore();
  if (!s.demoOpen) return null;
  const lowRisk = s.autonomy.agency.lowRisk;
  const items: [string, () => void][] = [
    ['Start goal: Acme HR webinar', () => s.startGoal('Book 100 webinar registrations for Acme HR')],
    ['Simulate: mailbox disconnects', s.simulateDisconnect],
    ['+1 week (goal progress)', s.plusWeek],
    [`Toggle low-risk fixes (now: ${lowRisk === 'ask' ? 'Ask me' : 'Auto'})`, s.toggleLowRisk],
  ];
  return (
    <div className="fixed bottom-4 left-4 z-50 w-[270px] rounded-xl border border-border bg-surface p-3 shadow-2xl animate-fade-up">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <FlaskConical size={13} /> Demo controls
        <button onClick={s.toggleDemo} className="ml-auto rounded p-0.5 hover:bg-surface-2">
          <X size={13} />
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map(([label, fn]) => (
          <button key={label} onClick={fn} className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs font-medium hover:border-primary/50 hover:bg-primary-soft/50">
            {label}
          </button>
        ))}
        <button onClick={s.reset} className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400">
          <RotateCcw size={12} /> Reset demo
        </button>
      </div>
      <div className="mt-2 text-[11px] text-muted">Press D to hide</div>
    </div>
  );
}

// ───────────── Autonomy settings ─────────────
type Opt<T> = { v: T; label: string };
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Opt<T>[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cx(
            'whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition',
            value === o.v ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Locked({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium">
      <Lock size={11} className="text-muted" /> {label}
    </span>
  );
}

export function AutonomyModal() {
  const s = useStore();
  const a: Autonomy = s.autonomy[s.autonomyScope] ?? s.autonomy.agency;
  const isOverride = s.autonomyScope !== 'agency' && !!s.autonomy[s.autonomyScope];
  const auto = [
    { v: 'auto-undo' as const, label: 'Auto with undo' },
    { v: 'ask' as const, label: 'Ask me' },
  ];
  const rows = [
    { type: 'Draft and prepare', ex: 'Write sequences, build lead lists (preview), plan schedules', ctl: <Locked label="Auto" /> },
    { type: 'Low-risk fixes', ex: 'Re-queue stuck sends, pause warmup on an unhealthy mailbox', ctl: <Segmented value={a.lowRisk} options={auto} onChange={(lowRisk) => s.setAutonomy({ lowRisk })} /> },
    { type: 'Fixes that change sending', ex: 'Move volume between mailboxes, pause a domain', ctl: <Segmented value={a.sendingFixes} options={auto} onChange={(sendingFixes) => s.setAutonomy({ sendingFixes })} /> },
    { type: 'Send email', ex: 'Launch campaigns, send replies', ctl: <Locked label="Ask me" /> },
    {
      type: 'Spend credits',
      ex: 'Find or verify leads',
      ctl: (
        <div className="flex flex-col items-start gap-1.5">
          <Segmented
            value={a.spend}
            options={[
              { v: 'ask', label: 'Ask me' },
              { v: 'auto-under', label: 'Auto under a limit' },
            ]}
            onChange={(spend) => s.setAutonomy({ spend })}
          />
          {a.spend === 'auto-under' && (
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Under
              <input
                type="number"
                value={a.spendLimit}
                min={0}
                onChange={(e) => s.setAutonomy({ spendLimit: Number(e.target.value) })}
                className="w-16 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-text"
              />
              credits/day
            </label>
          )}
        </div>
      ),
    },
  ];
  return (
    <Modal open={s.autonomyOpen} onClose={() => s.setAutonomyOpen(false)} title="What SA can do alone" width="max-w-3xl">
      <div className="px-5 pt-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">Apply to</span>
          <select
            value={s.autonomyScope}
            onChange={(e) => s.setAutonomyScope(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
          >
            <option value="agency">{AGENCY} (all clients)</option>
            {CLIENTS.map((c) => (
              <option key={c} value={c}>Override for {c}</option>
            ))}
          </select>
          {s.autonomyScope !== 'agency' && (
            <span className="text-xs text-muted">{isOverride ? 'Custom settings for this client' : 'Using agency settings until you change one'}</span>
          )}
        </div>
      </div>
      <div className="p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Action type</th>
              <th className="pb-2 font-medium">Example</th>
              <th className="pb-2 font-medium">Setting</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.type} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-medium">{r.type}</td>
                <td className="py-3 pr-4 text-muted">{r.ex}</td>
                <td className="py-3">{r.ctl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-surface-2 px-5 py-3 text-xs text-muted">
        <span>SA never sends without your approval. Everything SA does on its own can be undone.</span>
        <Button size="sm" onClick={() => s.setAutonomyOpen(false)}>Done</Button>
      </div>
    </Modal>
  );
}
