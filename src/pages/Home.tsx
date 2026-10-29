import { useState } from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { EXAMPLES } from '../data';
import { useStore } from '../store';
import { Button, Card, GateBadge } from '../ui';
import { GoalCard } from './Goals';

export default function Home() {
  const s = useStore();
  const [v, setV] = useState('');
  const open = s.actions
    .filter((a) => a.status === 'open')
    .sort((a, b) => b.rank - a.rank);
  const goals = s.goals;
  const submit = () => v.trim() && s.startGoal(v.trim());

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <div className="mx-auto max-w-[780px] text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          <Sparkles size={13} /> Smart Assistant
        </div>
        <h1 className="text-[40px] font-bold leading-tight">
          What do you want to <span className="text-gradient">achieve?</span>
        </h1>
        <p className="mt-2 text-[17px] text-muted">Describe the outcome. SA builds the whole plan with its agents, and you approve once.</p>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-2 text-left shadow-[0_8px_30px_rgba(16,24,40,0.06)] focus-within:border-primary/50">
          <textarea
            autoFocus
            rows={2}
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Describe an outcome, e.g. 30 demos for Cobalt Fintech this month"
            className="w-full resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-muted">SA drafts everything. Sending and spending wait for you.</span>
            <Button onClick={submit} disabled={!v.trim()}>
              Build plan <ArrowRight size={15} />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => setV(e)}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-primary/40 hover:text-primary"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-[1fr_1.15fr] gap-6">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Zap size={15} className="text-amber-500" /> Needs you ({open.length})
            </h2>
            <button onClick={() => s.go('actions')} className="text-xs font-medium text-primary hover:underline">
              Action center
            </button>
          </div>
          <div className="space-y-2.5">
            {open.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted">{a.client}</span>
                  <GateBadge gate={a.gate} />
                </div>
                <div className="text-sm">{a.found}</div>
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="soft" onClick={() => s.go('actions', a.id)}>
                    Review fix
                  </Button>
                </div>
              </div>
            ))}
            {open.length === 0 && <div className="py-6 text-center text-sm text-muted">Nothing needs you right now.</div>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Active goals</h2>
            <button onClick={() => s.go('goals')} className="text-xs font-medium text-primary hover:underline">
              All goals
            </button>
          </div>
          <div className="space-y-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} compact />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
