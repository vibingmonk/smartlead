import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MAILBOXES } from '../data';
import { useStore } from '../store';
import { Card, PageHeader, cx } from '../ui';

const STATUS_CLS: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Paused: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Draft: 'bg-surface-2 text-muted ring-1 ring-border',
  Completed: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Connected: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Warming: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Disconnected: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function Campaigns() {
  const s = useStore();
  const [tab, setTab] = useState('All');
  const rows = s.campaigns.filter((c) => tab === 'All' || c.status === tab);
  const count = (t: string) => s.campaigns.filter((c) => t === 'All' || c.status === t).length;
  return (
    <div className="px-8 py-8">
      <PageHeader title="Email campaigns" subtitle="Manage and track all your outreach campaigns" />
      <div className="mb-4 flex gap-6 border-b border-border text-sm">
        {['All', 'Active', 'Paused', 'Draft', 'Completed'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx('-mb-px border-b-2 pb-2.5 font-medium', tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text')}
          >
            {t === 'All' ? 'All campaigns' : t} ({count(t)})
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              {['Campaign', 'Client', 'Status', 'Leads', 'Sent', 'Opened', 'Replied', 'Positive'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    {c.name}
                    {c.bySA && (
                      <span className="inline-flex items-center gap-1 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        <Sparkles size={10} /> Built by SA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{c.steps} steps · Created {c.created}</div>
                </td>
                <td className="px-4 py-3 text-muted">{c.client}</td>
                <td className="px-4 py-3">
                  <span className={cx('rounded-md px-2 py-0.5 text-[11px] font-semibold', STATUS_CLS[c.status])}>{c.status}</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-primary">{c.leads.toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums text-primary">{c.sent.toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums text-fuchsia-600 dark:text-fuchsia-400">{c.opened}%</td>
                <td className="px-4 py-3 tabular-nums text-emerald-600 dark:text-emerald-400">{c.replied}%</td>
                <td className="px-4 py-3 tabular-nums">{c.positive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function Accounts() {
  const s = useStore();
  const simulated = s.actions.some((a) => a.id === 'bp' && a.status === 'open');
  const rows = MAILBOXES.map((m) =>
    m.email === 'ops@brightpath-mail.com' && simulated ? { ...m, status: 'Disconnected' as const, sentToday: 0 } : m,
  );
  return (
    <div className="px-8 py-8">
      <PageHeader title="Email accounts" subtitle="Mailbox health across all clients. The Deliverability agent keeps these warm." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              {['Mailbox', 'Client', 'Status', 'Warmup score', 'Daily limit', 'Sent today'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.email} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{m.email}</td>
                <td className="px-4 py-3 text-muted">{m.client}</td>
                <td className="px-4 py-3">
                  <span className={cx('rounded-md px-2 py-0.5 text-[11px] font-semibold', STATUS_CLS[m.status])}>{m.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border">
                      <div className={cx('h-full', m.warmup >= 90 ? 'bg-emerald-500' : m.warmup >= 80 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${m.warmup}%` }} />
                    </div>
                    <span className="tabular-nums">{m.warmup}</span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{m.limit}/day</td>
                <td className="px-4 py-3 tabular-nums">{m.sentToday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
