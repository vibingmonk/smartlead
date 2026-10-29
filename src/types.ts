export type Page = 'home' | 'goals' | 'campaigns' | 'accounts' | 'actions' | 'agents' | 'build';
export type Where = 'build' | 'sa';

export type Gate =
  | 'auto'
  | 'auto-draft'
  | 'auto-watch'
  | 'auto-undo'
  | 'approval-send'
  | 'approval-spend'
  | 'approval-fix';

export interface Chip { label: string; action: string }

export type MsgKind = 'text' | 'options' | 'checklist' | 'automation' | 'insight';

export interface Msg {
  id: string;
  role: 'user' | 'sa';
  text: string;
  kind?: MsgKind;
  chips?: Chip[];
  streamed?: boolean;
  items?: string[];
  done?: number;
  submitted?: boolean;
  on?: boolean;
  slack?: boolean;
  client?: string;
  body?: string;
}

export type NodeKey = 'goal' | 'prospect' | 'campaign' | 'deliver' | 'alert';
export type NodeStatus = 'hidden' | 'planning' | 'ready' | 'running';
export type ScenarioId = 'acme' | 'cobalt' | 'dune';

export interface Step { day: number; label: string; subject: string; body: string }
export interface Lead { name: string; title: string; company: string; size: string; location: string }
export interface Question { id: 'q1' | 'tone'; title: string; options: { label: string; desc: string }[] }

export interface Scenario {
  id: ScenarioId;
  client: string;
  planTitle: string;
  target: number;
  unit: string;
  goalNoun: string;
  deadline: (q1: string) => string;
  questions: Question[];
  defaults: { q1: string; tone: string };
  audience: string;
  audienceBig: string;
  leads: number;
  leadsBig: number;
  found: number;
  sample: Lead[];
  steps: Step[];
  email1Direct: { subject: string; body: string };
  step2Rewrite: { subject: string; body: string };
  middle: { label: string; ratio: number };
  estFull: string;
  estBig: string;
  estBigBoost: string;
  mailboxes: number;
  domain: string;
  history: string;
}

export interface BuildState {
  scenario: ScenarioId | null;
  goalText: string;
  mode: 'new' | 'adjust';
  phase: 'idle' | 'clarify' | 'building' | 'ready' | 'launched';
  msgs: Msg[];
  nodes: Record<NodeKey, NodeStatus>;
  q1: string;
  tone: string;
  bigOnly: boolean;
  shortEmail1: boolean;
  mailboxes: number;
  updated: NodeKey[];
  changed: NodeKey[];
  confirmOpen: boolean;
  stepEdits: Record<number, { subject: string; body: string }>;
  goalId: string | null;
}

export interface ActionItem {
  id: string;
  client: string;
  found: string;
  why: string;
  fix: string;
  ignoreCost: string;
  gate: Gate;
  sends: number;
  credits: number;
  rank: number;
  doneText: string;
  short: string;
  timeline: { t: string; e: string }[];
  draft?: string;
  status: 'open' | 'done' | 'dismissed';
  fresh?: boolean;
}

export interface AutoFix { id: string; client: string; text: string; time: string; undone?: boolean }
export interface WorkItem { id: string; label: string; kind: 'campaign' | 'watch' | 'fix' }
export interface Watch { id: string; client: string; checks: string; status: 'Healthy' | 'Alerting' | 'Issue found' | 'Reply waiting' }

export interface Goal {
  id: string;
  client: string;
  title: string;
  scenario?: ScenarioId;
  current: number;
  target: number;
  unit: string;
  status: 'on track' | 'at risk' | 'just launched';
  daysLeft: number;
  funnel: { label: string; value: string }[];
  backward?: { label: string; value: string }[];
  backwardNote?: string;
  projection?: string;
  suggestion?: boolean;
  adjusted?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  client: string;
  status: 'Active' | 'Paused' | 'Draft' | 'Completed';
  steps: number;
  leads: number;
  sent: number;
  opened: number;
  replied: number;
  positive: number;
  created: string;
  bySA?: boolean;
}

export interface Mailbox {
  email: string;
  client: string;
  warmup: number;
  status: 'Connected' | 'Disconnected' | 'Warming';
  limit: number;
  sentToday: number;
}

export interface Autonomy {
  lowRisk: 'auto-undo' | 'ask';
  sendingFixes: 'auto-undo' | 'ask';
  spend: 'ask' | 'auto-under';
  spendLimit: number;
}

export interface Toast { id: string; text: string; tone: 'info' | 'success' | 'warn' }
