import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft, Bell, CheckCircle2, ChevronDown, ChevronRight, Coins, Loader2, Mail, Send, ShieldCheck, Sparkles, Target, Users,
} from 'lucide-react';
import { SCENARIOS } from '../data';
import { fmt, plan, steps } from '../plan';
import { useStore } from '../store';
import type { Gate, NodeKey, NodeStatus } from '../types';
import { Button, ChatThread, Composer, Connector, GateBadge, Modal, cx } from '../ui';

export default function Build() {
  const b = useStore((s) => s.build);
  const buildChat = useStore((s) => s.buildChat);
  const go = useStore((s) => s.go);
  const sc = b.scenario ? SCENARIOS[b.scenario] : null;
  return (
    <div className="flex h-full min-h-0">
      {/* Chat (40%) */}
      <section className="flex w-[40%] min-w-[400px] flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <button onClick={() => go('home')} className="rounded-md p-1 text-muted hover:bg-surface-2">
            <ArrowLeft size={16} />
          </button>
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
            <Sparkles size={14} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Smart Assistant</div>
            <div className="truncate text-xs text-muted">{b.goalText || 'New goal'}</div>
          </div>
        </div>
        <ChatThread msgs={b.msgs} where="build" />
        <Composer id="build-composer" onSend={buildChat} placeholder="Change anything… e.g. “make it more direct”" />
      </section>

      {/* Plan canvas (60%) */}
      <section className="canvas-dots relative flex min-w-0 flex-1 flex-col">
        <div className="scroll-thin flex-1 overflow-y-auto px-8 pb-40 pt-6">
          {sc ? <Canvas /> : <EmptyCanvas />}
        </div>
        {sc && <ApprovalBar />}
      </section>
      <ConfirmModal />
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="mx-auto mt-24 max-w-sm text-center text-sm text-muted">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface">
        <Target size={20} className="text-primary" />
      </div>
      Your plan will appear here as SA's agents build it.
    </div>
  );
}

function Canvas() {
  const b = useStore((s) => s.build);
  const p = plan(b)!;
  const sc = p.sc;
  const n = b.nodes;
  const show = (k: NodeKey) => n[k] !== 'hidden';
  return (
    <div className="mx-auto max-w-[620px]">
      {/* Summary card (Apollo pattern) */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
          <Target size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{sc.planTitle}</div>
          <div className="text-xs text-muted">
            Goal: {sc.target} {sc.unit} {p.deadline} · {b.tone || sc.defaults.tone} tone
          </div>
        </div>
        <StatusLabel phase={b.phase} mode={b.mode} />
      </div>

      {b.phase === 'launched' && <RunningStrip />}

      {b.phase === 'clarify' && (
        <div className="rounded-xl border border-dashed border-border bg-surface/70 px-4 py-10 text-center text-sm text-muted">
          Answer the two questions in chat and SA will start building.
        </div>
      )}

      {show('goal') && (
        <div className="flex flex-col items-center">
          <span className="mb-2 rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
            Goal
          </span>
          <Node k="goal" agent="Goal" title={`${sc.target} ${sc.unit} ${p.deadline}`} icon={<Target size={16} />} status={n.goal}>
            {b.mode === 'adjust' ? (
              <div className="text-sm">
                <b>42 / 100</b> after week 1, tracking to <b>~78</b>. With these two changes SA estimates <b>~100</b>.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <Pill strong>{sc.target} {sc.unit}</Pill>
                  <Arrow />
                  <Pill>~{fmt(p.middle)} {sc.middle.label}</Pill>
                  <Arrow />
                  <Pill>{fmt(p.sends)} sends</Pill>
                  <Arrow />
                  <Pill>{fmt(p.leads)} leads × 3 steps</Pill>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium ring-1 ring-border">estimate</span>
                  Based on {sc.history}.
                  {b.bigOnly && (
                    <span className={cx('font-medium', p.atRisk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                      Now estimated {p.est} {sc.unit}.
                    </span>
                  )}
                </div>
              </>
            )}
          </Node>
        </div>
      )}

      {show('prospect') && (
        <>
          <Connector />
          <Node k="prospect" n={1} agent="Prospecting agent" title={b.mode === 'adjust' ? '+150 leads · same segment' : `${fmt(p.leads)} ${b.bigOnly ? sc.audienceBig : sc.audience}`} icon={<Users size={16} />} status={n.prospect} gate="approval-spend" cost={`${fmt(p.credits)} credits`}>
            <LeadTable />
          </Node>
        </>
      )}

      {show('campaign') && (
        <>
          <Connector />
          <Node k="campaign" n={2} agent="Campaign agent" title={b.mode === 'adjust' ? 'Step 2 rewritten · steps 1 and 3 unchanged' : `3-step sequence · ${b.tone} tone`} icon={<Mail size={16} />} status={n.campaign} gate="auto-draft">
            <Sequence />
          </Node>
        </>
      )}

      {show('deliver') && (
        <>
          <Connector />
          <Node k="deliver" n={3} agent="Deliverability agent" title={`${b.mailboxes} healthy mailboxes · warmup score 92–98 · 30/day each`} icon={<ShieldCheck size={16} />} status={n.deliver} gate="auto">
            <div className="space-y-1 text-sm text-muted">
              <div>Send window: Tue–Thu 9–11 am, lead's local time</div>
              <div>Domain: {sc.domain} · SPF, DKIM and DMARC checked</div>
            </div>
          </Node>
        </>
      )}

      {show('alert') && (
        <>
          <Connector />
          <Node k="alert" n={4} agent="Alert agent" title="Watching: mailbox health, bounce rate > 3%, reply rate < 1.5%, stuck queue" icon={<Bell size={16} />} status={n.alert} gate="auto-watch">
            <div className="text-sm text-muted">Checks every hour · times shown in IST · problems arrive in the Action center with a ready fix</div>
          </Node>
        </>
      )}
    </div>
  );
}

function StatusLabel({ phase, mode }: { phase: string; mode: string }) {
  if (phase === 'launched') return <span className="rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">Running</span>;
  if (phase === 'ready') return <span className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{mode === 'adjust' ? 'Changes ready' : 'Waiting for approval'}</span>;
  if (phase === 'building') return <span className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-muted ring-1 ring-border"><Loader2 size={12} className="animate-spin" /> Building</span>;
  return <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-muted ring-1 ring-border">Draft</span>;
}

const Pill = ({ children, strong }: { children: ReactNode; strong?: boolean }) => (
  <span className={cx('rounded-md px-2 py-0.5 tabular-nums', strong ? 'bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300' : 'bg-surface-2 ring-1 ring-border')}>{children}</span>
);
const Arrow = () => <span className="text-muted">←</span>;

function Node({
  k, n, agent, title, icon, status, gate, cost, children,
}: { k: NodeKey; n?: number; agent: string; title: string; icon: ReactNode; status: NodeStatus; gate?: Gate; cost?: string; children?: ReactNode }) {
  const b = useStore((s) => s.build);
  const updated = b.updated.includes(k);
  const changed = b.changed.includes(k);
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (updated && k !== 'goal') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [updated, k]);
  return (
    <div
      ref={ref}
      className={cx(
        'relative w-full rounded-xl border bg-surface shadow-sm transition animate-fade-up',
        changed ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-border',
        updated && 'updated-flash',
      )}
    >
      {(updated || changed) && (
        <span className="absolute -top-2.5 right-3 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
          {changed ? 'Changed' : 'Updated'}
        </span>
      )}
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            {n ? `${n} · ` : ''}
            {agent}
          </div>
          <div className="text-sm font-medium leading-snug">{status === 'planning' ? <span className="text-muted">Planning…</span> : title}</div>
        </div>
        <NodeStatusChip status={status} />
      </button>
      {status === 'planning' ? (
        <div className="space-y-2 px-4 pb-4">
          <div className="skeleton h-3 w-4/5" />
          <div className="skeleton h-3 w-3/5" />
        </div>
      ) : (
        <>
          {open && children && <div className="px-4 pb-3">{children}</div>}
          {(gate || cost) && (
            <div className="flex items-center gap-2 border-t border-border px-4 py-2">
              {cost && (
                <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium ring-1 ring-border">
                  <Coins size={11} /> {cost}
                </span>
              )}
              {gate && <GateBadge gate={gate} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NodeStatusChip({ status }: { status: NodeStatus }) {
  if (status === 'planning')
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-border">
        <Loader2 size={11} className="animate-spin" /> Planning…
      </span>
    );
  if (status === 'running')
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Running
      </span>
    );
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
      Ready <CheckCircle2 size={11} />
    </span>
  );
}

function LeadTable() {
  const b = useStore((s) => s.build);
  const sc = SCENARIOS[b.scenario!];
  const rows = b.bigOnly ? sc.sample.filter((l) => Number(l.size.replace(',', '')) >= 500).concat(sc.sample.filter((l) => Number(l.size.replace(',', '')) < 500)).slice(0, 5) : sc.sample;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-muted">Preview · 5 of {fmt(plan(b)!.leads)} leads</div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map((l) => {
            const small = b.bigOnly && Number(l.size.replace(',', '')) < 500;
            return (
              <tr key={l.name} className={cx('border-t border-border', small && 'opacity-35 line-through')}>
                <td className="px-3 py-1.5 font-medium">{l.name}</td>
                <td className="px-3 py-1.5 text-muted">{l.title}</td>
                <td className="px-3 py-1.5">{l.company}</td>
                <td className="px-3 py-1.5 text-muted tabular-nums">{l.size} emp.</td>
                <td className="px-3 py-1.5 text-muted">{l.location}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Sequence() {
  const b = useStore((s) => s.build);
  const editStep = useStore((s) => s.editStep);
  const [open, setOpen] = useState<number | null>(b.mode === 'adjust' ? 1 : null);
  const locked = b.phase === 'launched';
  return (
    <div className="space-y-1.5">
      {steps(b).map((st, i) => (
        <div key={i} className={cx('rounded-lg border', st.changed ? 'border-amber-400 bg-amber-500/5' : 'border-border')}>
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm">
            {open === i ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
            <span className="w-12 shrink-0 text-xs font-semibold text-primary">Day {st.day}</span>
            <span className="truncate font-medium">{st.subject}</span>
            <span className="ml-auto shrink-0 text-[11px] text-muted">{st.label}</span>
          </button>
          {open === i && (
            <div className="space-y-2 border-t border-border px-3 py-2.5">
              <input
                value={st.subject}
                disabled={locked}
                onChange={(e) => editStep(i, e.target.value, st.body)}
                className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm font-medium outline-none focus:border-primary/60"
              />
              <textarea
                value={st.body}
                disabled={locked}
                rows={Math.min(10, st.body.split('\n').length + 2)}
                onChange={(e) => editStep(i, st.subject, e.target.value)}
                className="w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-sm leading-relaxed outline-none focus:border-primary/60"
              />
              <div className="text-[11px] text-muted">{locked ? 'Running as approved' : 'Edit inline · nothing sends until you approve'}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ApprovalBar() {
  const b = useStore((s) => s.build);
  const setConfirm = useStore((s) => s.setConfirm);
  const p = plan(b)!;
  if (b.phase === 'launched' || b.phase === 'clarify' || b.phase === 'idle') return null;
  const ready = b.phase === 'ready';
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-8">
      <div className="pointer-events-auto flex w-full max-w-[620px] items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[0_8px_30px_rgba(16,24,40,0.12)]">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tabular-nums">
            {b.mode === 'adjust' && <span className="text-muted">Changes: </span>}
            {fmt(p.credits)} credits · {fmt(p.sends)} sends over {p.duration}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><Coins size={12} className="text-amber-500" /> spends credits</span>
            <span className="flex items-center gap-1"><Send size={12} className="text-amber-500" /> sends email</span>
            {!ready && <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> agents still planning</span>}
          </div>
        </div>
        <Button variant="secondary" disabled={!ready} onClick={() => document.getElementById('build-composer')?.focus()}>
          Edit
        </Button>
        <Button disabled={!ready} onClick={() => setConfirm(true)}>
          Approve & launch
        </Button>
      </div>
    </div>
  );
}

function RunningStrip() {
  const b = useStore((s) => s.build);
  const p = plan(b)!;
  const items =
    b.mode === 'adjust'
      ? ['step 2 rewritten', '150 new leads', '150 credits', `${b.mailboxes} mailboxes`]
      : [`leads ${fmt(p.leads)}/${fmt(p.leads)}`, 'sequence 3 steps', `${b.mailboxes} mailboxes`, 'Tue–Thu 9–11 lead-local', `${fmt(p.credits)} credits`];
  return (
    <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 animate-fade-up">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Running as approved</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {items.map((it) => (
          <span key={it} className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" /> {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function ConfirmModal() {
  const b = useStore((s) => s.build);
  const setConfirm = useStore((s) => s.setConfirm);
  const launch = useStore((s) => s.launch);
  if (!b.scenario) return null;
  const p = plan(b)!;
  const rows: [string, string][] =
    b.mode === 'adjust'
      ? [
          ['Spends', `${fmt(p.credits)} credits (150 new leads, same segment)`],
          ['Sends', `${fmt(p.sends)} emails over 9 days`],
          ['Changes', 'Step 2 copy for all leads who have not reached it yet'],
          ['Unchanged', 'Mailboxes, send window, monitoring'],
        ]
      : [
          ['Spends', `${fmt(p.credits)} credits to unlock ${fmt(p.leads)} leads`],
          ['Sends', `${fmt(p.sends)} emails over 2 weeks (3 steps)`],
          ['From', `${b.mailboxes} mailboxes on ${p.sc.domain}, max 30/day each`],
          ['When', "Tue–Thu 9–11 am, lead's local time"],
          ['Watching', 'Bounce, reply rate, mailbox health, stuck queue'],
        ];
  return (
    <Modal open={b.confirmOpen} onClose={() => setConfirm(false)} title={b.mode === 'adjust' ? 'Approve these changes?' : 'Approve and launch?'}>
      <div className="px-5 py-4">
        <dl className="divide-y divide-border rounded-xl border border-border text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-4 px-3.5 py-2.5">
              <dt className="w-20 shrink-0 text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">This is the only approval. SA runs exactly what's above and brings any change back to you first.</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3">
        <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
        <Button onClick={launch}>Confirm</Button>
      </div>
    </Modal>
  );
}
