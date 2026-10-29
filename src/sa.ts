import type { ScenarioId } from './types';

// Scripted, deterministic keyword matching. No model calls.

export function detectScenario(t: string): ScenarioId | null {
  const s = t.toLowerCase();
  if (/acme|webinar|registration/.test(s)) return 'acme';
  if (/cobalt|meetings?\b|demos?\b/.test(s)) return 'cobalt';
  if (/dune|re-?engage|cold leads?/.test(s)) return 'dune';
  return null;
}

export type Intent = 'watch' | 'direct' | 'big' | 'mailboxes' | 'approve' | 'actions' | 'insight' | 'goal' | null;

export function classify(t: string): Intent {
  const s = t.toLowerCase();
  if (/keep an eye|watch|tell me if|alert me|notify me/.test(s)) return 'watch';
  if (/direct|shorten|shorter|tone|punchier|concise/.test(s)) return 'direct';
  if (/\b500\b|over \d[\d,]* employees|bigger compan|larger compan|enterprise/.test(s)) return 'big';
  if (/mailbox/.test(s)) return 'mailboxes';
  if (/approve|launch|go ahead|ship it/.test(s)) return 'approve';
  if (/needs me|need me|issues|problems|action center|what's wrong/.test(s)) return 'actions';
  if (/step 2|reply rate|underperform|insight|why is/.test(s)) return 'insight';
  if (detectScenario(s) && /book|get|\d|re-?engage|meetings|registrations|demos/.test(s)) return 'goal';
  return null;
}
