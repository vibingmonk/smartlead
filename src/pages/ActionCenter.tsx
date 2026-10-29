import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, Eye, Settings2, Stethoscope, Undo2, Wrench, Zap } from 'lucide-react';
import { useStore } from '../store';
import type { ActionItem } from '../types';
import { Button, Card, GateBadge, Modal, PageHeader, cx } from '../ui';

export default function ActionCenter() {
  const s = useStore();
  const [confirmAll, setConfirmAll] = useState(false);
  const inClient = (c: string) => s.client === 'All clients' || c === s.client;
  const items = s.actions.filter((a) => a.status !== 'dismissed' && inClient(a.client)).sort((a, b) => b.rank - a.rank);
  const open = items.filter((a) => a.status === 'open');
  const fixed = s.autoFixed.filter((f) => inClient(f.client));
  const watching = s.watching.filter((w) => inClient(w.client));
  const totalSends = open.reduce((n, a) => n + a.sends, 0);
  const totalCredits = open.reduce((n, a) => n + a.credits, 0);

  return (
    <div className="mx-auto max-w-[1040px] px-8 py-8">
      <PageHeader
        title="Action center"
        subtitle="Issues SA found on its own, each with a diagnosis and a fix ready to go."
        right={
          <button onClick={() => s.setAutonomyOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <Settings2 size={15} /> Change what SA can do alone
          </button>
        }
      />

      <Section
        title={`Needs your approval (${open.length})`}
        hint="Ranked by cost if ignored"
        right={
          open.length > 1 && (
            <Button size="sm" onClick={() => setConfirmAll(true)}>
              Approve all ({open.length})
            </Button>
          )
        }
      >
        <div className="space-y-3">
          {items.map((a) => (
            <ActionCard key={a.id} a={a} />
          ))}
          {items.length === 0 && <Card className="p-8 text-center text-sm text-muted">All clear. SA will speak up when something needs you.</Card>}
        </div>
      </Section>

      <Section title={`Fixed automatically (${fixed.filter((f) => !f.undone).length})`} hint="Low-risk fixes SA made under your settings">
        <Card className="divide-y divide-border">
          {fixed.map((f) => (
            <div key={f.id} className={cx('flex items-center gap-3 px-4 py-3 text-sm', f.undone && 'opacity-50')}>
              <Wrench size={15} className="shrink-0 text-sky-500" />
              <span className={cx('flex-1', f.undone && 'line-through')}>
                {f.text} · <span className="text-muted">{f.time}</span>
              </span>
              <GateBadge gate="auto-undo" />
              {f.undone ? (
                <span className="w-16 text-right text-xs text-muted">Undone</span>
              ) : (
                <Button size="sm" variant="secondary" className="w-16" onClick={() => s.undoWork(f.id)}>
                  <Undo2 size={12} /> Undo
                </Button>
              )}
            </div>
          ))}
          {fixed.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">Nothing fixed automatically yet.</div>}
        </Card>
      </Section>

      <Section title="Watching" hint="Alert agents running per client">
        <Card className="divide-y divide-border">
          {watching.map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Eye size={14} className="shrink-0 text-muted" />
              <span className="w-40 shrink-0 font-medium">{w.client}</span>
              <span className="flex-1 text-muted">{w.checks}</span>
              <span
                className={cx(
                  'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                  w.status === 'Healthy' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                )}
              >
                {w.status}
              </span>
            </div>
          ))}
        </Card>
      </Section>

      <Modal open={confirmAll} onClose={() => setConfirmAll(false)} title={`Approve all ${open.length} fixes?`}>
        <div className="px-5 py-4 text-sm">
          <ul className="space-y-2">
            {open.map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <b>{a.client}:</b> {a.fix}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-surface-2 px-3 py-2 font-medium ring-1 ring-border">
            Total: {totalSends.toLocaleString()} sends · {totalCredits} credits
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3">
          <Button variant="secondary" onClick={() => setConfirmAll(false)}>Cancel</Button>
          <Button
            onClick={() => {
              s.approveAll();
              setConfirmAll(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, hint, right, children }: { title: string; hint?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <div className="text-xs text-muted">{hint}</div>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function ActionCard({ a }: { a: ActionItem }) {
  const s = useStore();
  const [details, setDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const focused = s.focusAction === a.id;
  useEffect(() => {
    if (focused) document.getElementById(`act-${a.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focused, a.id]);

  if (a.status === 'done')
    return (
      <Card className="flex items-center gap-3 border-emerald-500/40 bg-emerald-500/5 px-4 py-3 animate-fade-up">
        <CheckCircle2 size={18} className="text-emerald-500" />
        <div className="text-sm">
          <span className="font-semibold">{a.client}</span> · {a.doneText}
        </div>
      </Card>
    );

  return (
    <Card className={cx('overflow-hidden animate-fade-up', (a.fresh || focused) && 'ring-2 ring-amber-400/60')}>
      <div id={`act-${a.id}`} className="grid grid-cols-[1fr_1fr] gap-5 p-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{a.client}</span>
            {a.fresh && <span className="rounded bg-amber-400 px-1.5 text-[10px] font-bold uppercase text-black">New</span>}
          </div>
          <div className="text-sm font-semibold leading-snug">{a.found}</div>
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <Stethoscope size={14} className="mt-0.5 shrink-0" />
            <span>
              <b className="font-medium text-text">Why:</b> {a.why}
            </span>
          </div>
          <div className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">If ignored: {a.ignoreCost}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Zap size={12} /> Proposed fix
            </span>
            <GateBadge gate={a.gate} />
          </div>
          {editing ? (
            <textarea
              value={a.draft ?? a.fix}
              rows={a.draft ? 6 : 3}
              onChange={(e) => s.updateAction(a.id, a.draft !== undefined ? { draft: e.target.value } : { fix: e.target.value })}
              className="mt-1 w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary/60"
            />
          ) : (
            <>
              <div className="text-sm">{a.fix}</div>
              {a.draft && <div className="mt-2 whitespace-pre-line rounded-md border border-border bg-surface px-2.5 py-2 text-xs leading-relaxed text-muted">{a.draft}</div>}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <button onClick={() => setDetails((d) => !d)} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-text">
          <ChevronDown size={14} className={cx('transition', details && 'rotate-180')} /> See details
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => s.dismissAction(a.id)}>
            Dismiss
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing((e) => !e)}>
            {editing ? 'Done editing' : 'Edit'}
          </Button>
          <Button size="sm" onClick={() => s.approveAction(a.id)}>
            Approve fix
          </Button>
        </div>
      </div>
      {details && (
        <div className="border-t border-border bg-surface-2 px-4 py-3 animate-fade-up">
          <ol className="relative ml-1.5 space-y-2 border-l border-border pl-4">
            {a.timeline.map((t, i) => (
              <li key={i} className="text-sm">
                <span className="absolute -left-[4.5px] mt-1.5 h-2 w-2 rounded-full bg-primary" />
                <span className="mr-2 text-xs text-muted">{t.t}</span>
                {t.e}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
