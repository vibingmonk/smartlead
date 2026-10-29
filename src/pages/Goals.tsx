import { useState } from 'react';
import { ChevronDown, Lightbulb, Target } from 'lucide-react';
import { useStore } from '../store';
import type { Goal } from '../types';
import { Button, Card, GateBadge, PageHeader, ProgressBar, cx } from '../ui';

export default function Goals() {
  const s = useStore();
  const goals = s.goals.filter((g) => s.client === 'All clients' || g.client === s.client);
  return (
    <div className="mx-auto max-w-[980px] px-8 py-8">
      <PageHeader title="Goals" subtitle="SA owns the outcome, not just the task. It tracks each goal and proposes changes when you drift." />
      <div className="space-y-4">
        {goals.map((g) => (
          <Card key={g.id} className="p-5">
            <GoalCard goal={g} />
          </Card>
        ))}
        {goals.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted">
            No goals for this client yet.{' '}
            <button className="font-medium text-primary hover:underline" onClick={() => s.go('home')}>
              Start one
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}

const STATUS = {
  'on track': { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', bar: 'green' as const },
  'at risk': { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', bar: 'amber' as const },
  'just launched': { cls: 'bg-primary-soft text-primary', bar: 'purple' as const },
};

export function GoalCard({ goal: g, compact }: { goal: Goal; compact?: boolean }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const st = STATUS[g.status];
  const clickable = !!g.backward;
  return (
    <div className={cx(compact && 'rounded-lg border border-border p-3')}>
      <div
        className={cx('flex items-start gap-3', clickable && 'cursor-pointer')}
        onClick={() => (compact ? s.go('goals') : clickable && setOpen((o) => !o))}
      >
        {!compact && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Target size={17} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={cx('truncate font-semibold', compact ? 'text-sm' : 'text-base')}>{g.title}</div>
            <span className={cx('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', st.cls)}>{g.status}</span>
            {g.adjusted && <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted ring-1 ring-border">plan updated</span>}
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <ProgressBar value={(g.current / g.target) * 100} tone={st.bar} />
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {g.current} / {g.target}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            {g.funnel.map((f, i) => (
              <span key={f.label} className="flex items-center gap-1.5">
                {i > 0 && <span>→</span>}
                <span>
                  <b className="font-semibold text-text tabular-nums">{f.value}</b> {f.label}
                </span>
              </span>
            ))}
            <span className="ml-auto">
              {g.daysLeft} days left{g.projection && ` · tracking to ${g.projection}`}
            </span>
          </div>
        </div>
        {clickable && !compact && <ChevronDown size={16} className={cx('mt-1 text-muted transition', open && 'rotate-180')} />}
      </div>

      {open && g.backward && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 animate-fade-up">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Working backwards from the goal</div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {g.backward.map((b, i) => (
              <span key={b.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted">←</span>}
                <span className={cx('rounded-lg bg-surface px-2.5 py-1 ring-1 ring-border', i === 0 && 'font-semibold')}>
                  {b.value} {b.label}
                </span>
              </span>
            ))}
          </div>
          {g.backwardNote && <p className="mt-3 text-sm text-muted">{g.backwardNote}</p>}
          {g.id === 'g-cobalt' && s.actions.some((a) => a.id === 'cobalt-bounce' && a.status === 'open') && (
            <Button size="sm" variant="soft" className="mt-3" onClick={() => s.go('actions', 'cobalt-bounce')}>
              Review the bounce fix
            </Button>
          )}
        </div>
      )}

      {g.suggestion && !compact && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-4 animate-fade-up">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Lightbulb size={14} /> SA weekly suggestion
          </div>
          <p className="text-sm leading-relaxed">
            You're at {g.current}/{g.target} with {g.daysLeft} days left, which tracks to about 78. Reply rate on step 2 is half of step 1. I'd rewrite
            step 2 and add 150 leads from the same segment (150 credits). That gets you to roughly 100.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => s.startAdjust(g.id)}>
              Approve changes
            </Button>
            <GateBadge gate="approval-spend" />
            <Button size="sm" variant="ghost" onClick={() => s.startAdjust(g.id)}>
              See plan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => s.dismissSuggestion(g.id)}>
              Not now
            </Button>
          </div>
        </div>
      )}
      {g.suggestion && compact && <div className="mt-2 text-xs font-medium text-primary">SA has a suggestion to close the gap →</div>}
    </div>
  );
}
