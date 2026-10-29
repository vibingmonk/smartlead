import { SCENARIOS } from './data';
import type { BuildState, ScenarioId } from './types';

export const fmt = (n: number) => n.toLocaleString('en-US');
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

const dateOf = (q1: string) => q1.match(/\d{1,2} \w{3}/)?.[0] ?? '[date]';

export function fill(text: string, b: BuildState) {
  const meeting = b.q1 === 'Product demo' ? 'product demo' : '20-minute call';
  return text.replace(/\{date\}/g, dateOf(b.q1)).replace(/\{meeting\}/g, meeting);
}

/** Derived numbers for the plan canvas and the approval bar. */
export function plan(b: BuildState) {
  if (!b.scenario) return null;
  const sc = SCENARIOS[b.scenario];
  const leads = b.mode === 'adjust' ? 150 : b.bigOnly ? sc.leadsBig : sc.leads;
  const sends = leads * 3;
  const raw = sends * sc.middle.ratio;
  const middle = raw >= 200 ? Math.round(raw / 10) * 10 : Math.round(raw);
  const boosted = b.mailboxes > sc.mailboxes;
  const est = b.bigOnly ? (boosted ? sc.estBigBoost : sc.estBig) : sc.estFull;
  return {
    sc,
    leads,
    credits: leads,
    sends,
    middle,
    est,
    atRisk: b.bigOnly && !boosted,
    deadline: sc.deadline(b.q1),
    duration: b.mode === 'adjust' ? '9 days' : '2 weeks',
  };
}

export function steps(b: BuildState) {
  const sc = SCENARIOS[b.scenario as ScenarioId];
  return sc.steps.map((s, i) => {
    let { subject, body } = s;
    if (i === 0 && b.shortEmail1) ({ subject, body } = sc.email1Direct);
    if (i === 1 && b.mode === 'adjust') ({ subject, body } = sc.step2Rewrite);
    const edit = b.stepEdits[i];
    if (edit) ({ subject, body } = edit);
    return { ...s, subject: fill(subject, b), body: fill(body, b), changed: i === 1 && b.mode === 'adjust' };
  });
}

/** Next three top-of-hour runs, shown in IST. */
export function nextRunsIST() {
  const ist = Date.now() + 5.5 * 3600_000;
  const hour = Math.floor(ist / 3600_000) * 3600_000;
  return [1, 2, 3]
    .map((i) =>
      new Date(hour + i * 3600_000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }),
    )
    .join(', ')
    .concat(' IST');
}
