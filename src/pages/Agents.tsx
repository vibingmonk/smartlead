import { Bell, Eye, Mail, MessageSquareReply, ShieldCheck, Users } from 'lucide-react';
import { AGENTS } from '../data';
import { useStore } from '../store';
import { Button, Card, PageHeader, cx } from '../ui';

const ICONS = { prospecting: Users, campaign: Mail, deliverability: ShieldCheck, reply: MessageSquareReply, alert: Bell };

export default function Agents() {
  const openSA = useStore((s) => s.openSA);
  return (
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <PageHeader title="Agents" subtitle="You don't need to manage these. Tell SA what you want; it runs the right agents." />
      <div className="grid grid-cols-3 gap-4">
        {AGENTS.map((a) => {
          const Icon = ICONS[a.id as keyof typeof ICONS];
          return (
            <Card key={a.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={19} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {a.name}
                    {a.isNew && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                  </div>
                  <div className={cx('flex items-center gap-1.5 text-xs', a.status === 'Running' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted')}>
                    <span className={cx('h-1.5 w-1.5 rounded-full', a.status === 'Running' ? 'animate-pulse bg-emerald-500' : 'bg-muted/50')} />
                    {a.status}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted">{a.does}</p>
              <div className="mt-4 space-y-1.5 text-xs">
                <div>
                  <span className="text-muted">Runs for: </span>
                  {a.clients.join(', ')}
                </div>
                <div>
                  <span className="text-muted">Last action: </span>
                  {a.last}
                </div>
              </div>
              <div className="mt-auto pt-4">
                <Button size="sm" variant="soft" className="w-full" onClick={() => openSA(a.watch)}>
                  <Eye size={13} /> Watch this for me
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
