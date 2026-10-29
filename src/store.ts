import { create } from 'zustand';
import { BRIGHTPATH, BRIGHTPATH_WARMUP, DEFAULT_AUTONOMY, EXAMPLES, INSIGHT, SCENARIOS, initialData } from './data';
import { classify, detectScenario } from './sa';
import { fmt, nowTime, plan, steps, wordCount } from './plan';
import type {
  ActionItem, AutoFix, Autonomy, BuildState, Campaign, Chip, Goal, Msg, NodeKey, NodeStatus, Page, Toast,
  Watch, Where, WorkItem,
} from './types';

// Timers for scripted sequences, cleared on reset or when a new goal starts.
let timers: number[] = [];
const later = (fn: () => void, ms: number) => void timers.push(window.setTimeout(fn, ms));
const clearTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

let idc = 0;
const uid = (p = 'm') => `${p}${++idc}`;

const sa = (text: string, extra: Partial<Msg> = {}): Msg => ({ id: uid(), role: 'sa', text, kind: 'text', ...extra });
const user = (text: string): Msg => ({ id: uid(), role: 'user', text, streamed: true });

const HIDDEN: Record<NodeKey, NodeStatus> = { goal: 'hidden', prospect: 'hidden', campaign: 'hidden', deliver: 'hidden', alert: 'hidden' };
const RUNNING: Record<NodeKey, NodeStatus> = { goal: 'running', prospect: 'running', campaign: 'running', deliver: 'running', alert: 'running' };

const freshBuild = (): BuildState => ({
  scenario: null,
  goalText: '',
  mode: 'new',
  phase: 'idle',
  msgs: [],
  nodes: { ...HIDDEN },
  q1: '',
  tone: '',
  bigOnly: false,
  shortEmail1: false,
  mailboxes: 0,
  updated: [],
  changed: [],
  confirmOpen: false,
  stepEdits: {},
  goalId: null,
});

const EXAMPLE_CHIPS: Chip[] = EXAMPLES.map((e) => ({ label: e, action: `goal:${e}` }));
const EDIT_DIRECT = 'Make the tone more direct and shorten email 1';
const EDIT_BIG = 'Only companies over 500 employees';
const WATCH_TEXT = 'Keep an eye on reply rate for Acme HR, tell me if it drops below 2%';

const saGreeting = (): Msg[] => [
  sa("Hi, I'm your Smart Assistant. Tell me an outcome and I'll build the plan, or ask me to watch something for you.", {
    streamed: true,
    chips: [
      { label: 'Book 100 webinar registrations for Acme HR', action: `goal:${EXAMPLES[0]}` },
      { label: 'What needs me?', action: 'goto:actions' },
    ],
  }),
  sa('Something I noticed this morning:', {
    kind: 'insight',
    body: INSIGHT,
    streamed: true,
    chips: [
      { label: 'Draft two alternatives', action: 'alternatives' },
      { label: 'Not now', action: 'dismiss' },
    ],
  }),
];

interface Store {
  page: Page;
  theme: 'light' | 'dark';
  saOpen: boolean;
  saDraft: string;
  demoOpen: boolean;
  autonomyOpen: boolean;
  focusAction: string | null;
  saMsgs: Msg[];
  build: BuildState;
  actions: ActionItem[];
  autoFixed: AutoFix[];
  watching: Watch[];
  work: WorkItem[];
  goals: Goal[];
  campaigns: Campaign[];
  autonomy: Autonomy;
  toasts: Toast[];

  go: (p: Page, focus?: string) => void;
  toggleTheme: () => void;
  openSA: (draft?: string) => void;
  closeSA: () => void;
  toggleDemo: () => void;
  setAutonomyOpen: (o: boolean) => void;
  toast: (text: string, tone?: Toast['tone']) => void;

  markStreamed: (where: Where, id: string) => void;
  runChip: (action: string, where: Where) => void;

  startGoal: (text: string) => void;
  setOption: (id: 'q1' | 'tone', v: string) => void;
  submitOptions: () => void;
  buildChat: (text: string) => void;
  editStep: (i: number, subject: string, body: string) => void;
  setConfirm: (o: boolean) => void;
  launch: () => void;
  startAdjust: (goalId: string) => void;

  saSend: (text: string) => void;
  turnOnAutomation: (where: Where, id: string) => void;
  toggleSlack: (where: Where, id: string) => void;

  approveAction: (id: string) => void;
  approveAll: () => void;
  dismissAction: (id: string) => void;
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  undoWork: (id: string) => void;
  simulateDisconnect: () => void;
  plusWeek: () => void;
  dismissSuggestion: (goalId: string) => void;

  setAutonomy: (patch: Partial<Autonomy>) => void;
  toggleLowRisk: () => void;
  reset: () => void;
}

export const useStore = create<Store>((set, get) => {
  const setB = (patch: Partial<BuildState>) => set((s) => ({ build: { ...s.build, ...patch } }));
  const setNodes = (patch: Partial<Record<NodeKey, NodeStatus>>) =>
    set((s) => ({ build: { ...s.build, nodes: { ...s.build.nodes, ...patch } } }));
  const push = (where: Where, ...msgs: Msg[]) =>
    where === 'build'
      ? set((s) => ({ build: { ...s.build, msgs: [...s.build.msgs, ...msgs] } }))
      : set((s) => ({ saMsgs: [...s.saMsgs, ...msgs] }));
  const patchMsg = (where: Where, id: string, patch: Partial<Msg>) => {
    const map = (ms: Msg[]) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m));
    where === 'build'
      ? set((s) => ({ build: { ...s.build, msgs: map(s.build.msgs) } }))
      : set((s) => ({ saMsgs: map(s.saMsgs) }));
  };
  const reply = (where: Where, msg: Msg, delay = 450) => later(() => push(where, msg), delay);
  const flash = (keys: NodeKey[]) => {
    setB({ updated: keys });
    later(() => setB({ updated: [] }), 2000);
  };
  const addWork = (item: WorkItem) => set((s) => ({ work: [...s.work, item] }));

  const automationMsg = (client: string): Msg =>
    sa(`Here's the automation for ${client}. Turn it on and I'll check every hour.`, {
      kind: 'automation',
      client,
      chips: [
        { label: 'Show what needs me', action: 'goto:actions' },
        { label: 'Change what SA can do alone', action: 'autonomy' },
      ],
    });

  const fallback = (where: Where) =>
    reply(
      where,
      sa(
        where === 'build' && get().build.scenario
          ? "I didn't catch a change there. Here are things I can change in this plan:"
          : 'I can help with these right now:',
        {
          chips:
            where === 'build' && get().build.scenario
              ? [
                  { label: EDIT_DIRECT, action: 'edit:direct' },
                  { label: EDIT_BIG, action: 'edit:big' },
                  { label: 'Watch reply rate weekly', action: 'watch' },
                ]
              : [...EXAMPLE_CHIPS.slice(0, 2), { label: 'What needs me?', action: 'goto:actions' }],
        },
      ),
    );

  return {
    page: 'home',
    theme: 'light',
    saOpen: false,
    saDraft: '',
    demoOpen: false,
    autonomyOpen: false,
    focusAction: null,
    saMsgs: saGreeting(),
    build: freshBuild(),
    ...initialData(),
    autonomy: { ...DEFAULT_AUTONOMY },
    toasts: [],

    go: (page, focus) => set({ page, focusAction: focus ?? null, saOpen: page === 'build' ? false : get().saOpen }),
    toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
    openSA: (draft = '') => set({ saOpen: true, saDraft: draft }),
    closeSA: () => set({ saOpen: false }),
    toggleDemo: () => set((s) => ({ demoOpen: !s.demoOpen })),
    setAutonomyOpen: (autonomyOpen) => set({ autonomyOpen }),
    toast: (text, tone = 'info') => {
      const id = uid('t');
      set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
      window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
    },

    markStreamed: (where, id) => patchMsg(where, id, { streamed: true }),

    runChip: (action, where) => {
      const s = get();
      const [verb, arg] = [action.split(':')[0], action.slice(action.indexOf(':') + 1)];
      switch (verb) {
        case 'goal':
          return s.startGoal(arg);
        case 'goto':
          set({ saOpen: false });
          return s.go(arg as Page);
        case 'approve':
          return s.build.phase === 'ready' ? s.setConfirm(true) : s.go('build');
        case 'edit':
          return s.buildChat(arg === 'direct' ? EDIT_DIRECT : EDIT_BIG);
        case 'autonomy':
          return s.setAutonomyOpen(true);
        case 'defaults':
          return s.submitOptions();
        case 'add-mailboxes': {
          const p = plan(s.build)!;
          push(where, user('Add mailboxes'));
          setB({ mailboxes: p.sc.mailboxes + 2 });
          flash(['deliver', 'goal']);
          return reply(
            where,
            sa(
              `Added 2 healthy mailboxes (${p.sc.mailboxes + 2} total, no cost). The estimate is back to ${p.sc.estBigBoost} ${p.sc.unit}.`,
              { chips: [{ label: 'Approve & launch', action: 'approve' }, { label: EDIT_DIRECT, action: 'edit:direct' }] },
            ),
          );
        }
        case 'keep': {
          const p = plan(s.build)!;
          push(where, user('Keep as is'));
          return reply(
            where,
            sa(`Keeping ${fmt(p.leads)} leads. The estimate stays at ${p.est} ${p.sc.unit}, and I'll flag it on the Goals page.`, {
              chips: [{ label: 'Add mailboxes', action: 'add-mailboxes' }, { label: 'Approve & launch', action: 'approve' }],
            }),
          );
        }
        case 'watch': {
          const client = (where === 'build' && s.build.scenario && SCENARIOS[s.build.scenario].client) || 'Acme HR';
          push(where, user(`Watch reply rate for ${client} weekly`));
          return reply(where, automationMsg(client));
        }
        case 'alternatives':
          push(where, user('Draft two alternatives'));
          return reply(
            where,
            sa(
              'Two alternatives for Acme HR step 2. Both are drafts; nothing sends until you approve.\n\nA · “The one hiring rule that saved 6 hours a week”: leads with one concrete speaker result.\n\nB · “Is your interview loop too long?”: a question that matches the webinar topic.',
              { chips: [{ label: 'Use option A', action: 'use-alt' }, { label: 'Watch reply rate', action: 'watch' }] },
            ),
            600,
          );
        case 'use-alt':
          push(where, user('Use option A'));
          return reply(
            where,
            sa('Option A is ready as a change to the running campaign. You can approve it with your next goal update on the Goals page.', {
              chips: [{ label: 'Open Goals', action: 'goto:goals' }, { label: 'What needs me?', action: 'goto:actions' }],
            }),
          );
        case 'dismiss':
          push(where, user('Not now'));
          return reply(
            where,
            sa("Okay. I'll keep watching it and bring it back if the gap grows.", {
              chips: [{ label: 'What needs me?', action: 'goto:actions' }, { label: 'Track goals', action: 'goto:goals' }],
            }),
          );
      }
    },

    // ───────────── Build view ─────────────
    startGoal: (text) => {
      clearTimers();
      const id = detectScenario(text);
      const b = freshBuild();
      b.goalText = text;
      b.msgs.push(user(text));
      if (!id) {
        b.msgs.push(sa('In this demo I can build full plans for these goals. Pick one to see the agents at work:', { chips: EXAMPLE_CHIPS }));
        set({ page: 'build', build: b, saOpen: false });
        return;
      }
      const sc = SCENARIOS[id];
      Object.assign(b, { scenario: id, phase: 'clarify', q1: sc.defaults.q1, tone: sc.defaults.tone, mailboxes: sc.mailboxes });
      b.msgs.push(sa("Got it. Two quick choices, then I'll build the plan.", { kind: 'options' }));
      set({ page: 'build', build: b, saOpen: false });
    },

    setOption: (id, v) => setB(id === 'q1' ? { q1: v } : { tone: v }),

    submitOptions: () => {
      const b = get().build;
      if (b.phase !== 'clarify') return;
      const p = plan(b)!;
      const msgs = b.msgs.map((m) => (m.kind === 'options' ? { ...m, submitted: true } : m));
      const items = [
        `Found ${fmt(p.sc.found)} matching leads, picked ${fmt(p.leads)}`,
        'Drafted 3-step sequence',
        `Picked ${b.mailboxes} healthy mailboxes`,
        'Set up monitoring',
      ];
      const cl = sa('Building your plan…', { kind: 'checklist', items, done: 0 });
      setB({ msgs: [...msgs, user(`${b.q1} · ${b.tone}`), cl], phase: 'building', nodes: { ...HIDDEN, goal: 'planning' } });
      const done = (n: number) => patchMsg('build', cl.id, { done: n });
      later(() => setNodes({ goal: 'ready', prospect: 'planning' }), 800);
      later(() => (setNodes({ prospect: 'ready', campaign: 'planning' }), done(1)), 1650);
      later(() => (setNodes({ campaign: 'ready', deliver: 'planning' }), done(2)), 2450);
      later(() => (setNodes({ deliver: 'ready', alert: 'planning' }), done(3)), 3150);
      later(() => {
        setNodes({ alert: 'ready' });
        done(4);
        setB({ phase: 'ready' });
        push(
          'build',
          sa(
            `Your plan is ready: ${fmt(p.credits)} credits and ${fmt(p.sends)} sends over 2 weeks. Change anything in chat, or approve when you're happy.`,
            {
              chips: [
                { label: EDIT_DIRECT, action: 'edit:direct' },
                { label: EDIT_BIG, action: 'edit:big' },
                { label: 'Approve & launch', action: 'approve' },
              ],
            },
          ),
        );
      }, 3900);
    },

    buildChat: (text) => {
      const s = get();
      const b = s.build;
      const intent = classify(text);
      if (intent === 'goal' && (b.phase === 'idle' || b.phase === 'launched')) return s.startGoal(text);
      push('build', user(text));
      if (intent === 'watch') return reply('build', automationMsg(detectScenario(text) ? SCENARIOS[detectScenario(text)!].client : 'Acme HR'));
      if (intent === 'actions')
        return reply('build', sa(`${s.actions.filter((a) => a.status === 'open').length} things need you in the Action center.`, {
          chips: [{ label: 'Show what needs me', action: 'goto:actions' }, { label: 'Track goals', action: 'goto:goals' }],
        }));
      if (!b.scenario || b.phase === 'clarify' || b.phase === 'building') {
        if (b.phase === 'clarify')
          return reply('build', sa('Pick the two options above and hit Continue first. You can change anything after the plan is built.', {
            chips: [{ label: 'Use the defaults', action: 'defaults' }],
          }));
        return fallback('build');
      }
      if (b.phase === 'launched' && (intent === 'direct' || intent === 'big' || intent === 'mailboxes'))
        return reply('build', sa("This plan is already running as approved. I'll prepare changes as an update for you to approve from the Goals page.", {
          chips: [{ label: 'Track this goal', action: 'goto:goals' }, { label: 'Show what needs me', action: 'goto:actions' }],
        }));
      const sc = SCENARIOS[b.scenario];
      switch (intent) {
        case 'direct': {
          const { 0: _dropped, ...stepEdits } = b.stepEdits;
          setB({ shortEmail1: true, tone: 'Direct', stepEdits });
          const wc = wordCount(steps(get().build)[0].body);
          later(() => flash(['campaign']), 350);
          return reply('build', sa(`Shortened email 1 to ${wc} words and switched to a direct tone.`, {
            chips: [
              ...(b.bigOnly ? [] : [{ label: EDIT_BIG, action: 'edit:big' }]),
              { label: 'Approve & launch', action: 'approve' },
              { label: 'Watch reply rate weekly', action: 'watch' },
            ],
          }));
        }
        case 'big': {
          setB({ bigOnly: true });
          later(() => flash(['prospect', 'goal']), 350);
          return reply('build', sa(
            `Updated to ${fmt(sc.leadsBig)} leads at ${fmt(sc.leadsBig)} credits. That gets you an estimated ${sc.estBig} ${sc.unit}. Add 2 more mailboxes to keep the goal? (no cost)`,
            { chips: [{ label: 'Add mailboxes', action: 'add-mailboxes' }, { label: 'Keep as is', action: 'keep' }] },
          ));
        }
        case 'mailboxes':
          return get().runChip('add-mailboxes', 'build');
        case 'approve':
          return b.phase === 'ready' ? s.setConfirm(true) : fallback('build');
        case 'insight':
          return reply('build', sa('From past campaigns:', {
            kind: 'insight',
            body: INSIGHT,
            chips: [{ label: 'Draft two alternatives', action: 'alternatives' }, { label: 'Not now', action: 'dismiss' }],
          }));
        default:
          return fallback('build');
      }
    },

    editStep: (i, subject, body) => setB({ stepEdits: { ...get().build.stepEdits, [i]: { subject, body } } }),

    setConfirm: (confirmOpen) => setB({ confirmOpen }),

    launch: () => {
      const s = get();
      const b = s.build;
      const p = plan(b)!;
      setB({ confirmOpen: false, phase: 'launched', nodes: { ...RUNNING }, changed: [] });
      if (b.mode === 'adjust') {
        set((st) => ({
          goals: st.goals.map((g) =>
            g.id === b.goalId ? { ...g, status: 'on track', suggestion: false, adjusted: true, projection: '~100' } : g,
          ),
        }));
        addWork({ id: uid('w'), label: `${p.sc.client} · step 2 rewrite + 150 leads`, kind: 'campaign' });
        push('build', sa("Changes are live. Step 2 is rewritten and 150 new leads start with tomorrow's sends. I'll report back next week.", {
          chips: [{ label: 'Track this goal', action: 'goto:goals' }, { label: 'Show what needs me', action: 'goto:actions' }],
        }));
        s.toast(`Approved · ${p.sc.client} goal update is running`, 'success');
        return;
      }
      const goalId = `g-${p.sc.id}`;
      addWork({ id: uid('w'), label: `${p.sc.client} · ${p.sc.goalNoun} campaign`, kind: 'campaign' });
      addWork({ id: uid('w'), label: `${p.sc.client} · monitoring (Alert agent)`, kind: 'watch' });
      set((st) => ({
        goals: [
          {
            id: goalId,
            client: p.sc.client,
            scenario: p.sc.id,
            title: `${p.sc.client} · ${p.sc.target} ${p.sc.goalNoun} ${p.deadline}`,
            current: 0,
            target: p.sc.target,
            unit: p.sc.unit,
            status: 'just launched',
            daysLeft: 16,
            funnel: [
              { label: 'sends', value: '0' },
              { label: p.sc.middle.label, value: '0' },
              { label: 'replies', value: '0' },
              { label: p.sc.unit, value: '0' },
            ],
            projection: p.est,
          },
          ...st.goals.filter((g) => g.id !== goalId),
        ],
        campaigns: [
          {
            id: uid('c'),
            name: p.sc.planTitle.replace(' · Campaign plan', ''),
            client: p.sc.client,
            status: 'Active',
            steps: 3,
            leads: p.leads,
            sent: 0,
            opened: 0,
            replied: 0,
            positive: 0,
            created: 'Today',
            bySA: true,
          },
          ...st.campaigns,
        ],
      }));
      setB({ goalId });
      push('build', sa(
        `Launched. It's running exactly as approved: ${fmt(p.leads)} leads, 3 steps, ${b.mailboxes} mailboxes, ${fmt(p.credits)} credits. I'll watch it and bring you fixes if anything drifts.`,
        {
          chips: [
            { label: 'Track this goal', action: 'goto:goals' },
            { label: 'Show what needs me', action: 'goto:actions' },
            { label: 'Watch reply rate weekly', action: 'watch' },
          ],
        },
      ));
      s.toast(`Launched · ${p.sc.client} campaign is running as approved`, 'success');
    },

    startAdjust: (goalId) => {
      clearTimers();
      const g = get().goals.find((x) => x.id === goalId);
      if (!g) return;
      const sc = SCENARIOS.acme;
      const b = freshBuild();
      Object.assign(b, {
        scenario: 'acme',
        mode: 'adjust',
        goalText: g.title,
        phase: 'ready',
        q1: sc.defaults.q1,
        tone: sc.defaults.tone,
        mailboxes: sc.mailboxes,
        goalId,
        nodes: { ...RUNNING, prospect: 'ready', campaign: 'ready' },
        changed: ['prospect', 'campaign'],
      });
      b.msgs = [
        user('Approve changes'),
        sa("Here's your running plan with only the two changes highlighted: a rewritten step 2 and 150 more leads from the same segment. Everything else keeps running as approved.", {
          chips: [{ label: 'Approve & launch', action: 'approve' }, { label: 'Back to Goals', action: 'goto:goals' }],
        }),
      ];
      set({ page: 'build', build: b, saOpen: false });
    },

    // ───────────── SA side panel ─────────────
    saSend: (text) => {
      const s = get();
      push('sa', user(text));
      const intent = classify(text);
      if (intent === 'goal') {
        reply('sa', sa("Let's build that. Opening the plan builder…", { chips: [{ label: 'Open plan builder', action: `goal:${text}` }] }));
        later(() => get().startGoal(text), 1200);
        return;
      }
      if (intent === 'watch') {
        const id = detectScenario(text);
        return reply('sa', automationMsg(id ? SCENARIOS[id].client : 'Acme HR'));
      }
      if (intent === 'insight')
        return reply('sa', sa('Here is what I see:', {
          kind: 'insight',
          body: INSIGHT,
          chips: [{ label: 'Draft two alternatives', action: 'alternatives' }, { label: 'Not now', action: 'dismiss' }],
        }));
      if (intent === 'actions') {
        const open = s.actions.filter((a) => a.status === 'open');
        return reply('sa', sa(`${open.length} things need you. The most urgent: ${open.sort((a, b) => b.rank - a.rank)[0]?.found ?? 'nothing right now'}.`, {
          chips: [{ label: 'Show what needs me', action: 'goto:actions' }, { label: 'Change what SA can do alone', action: 'autonomy' }],
        }));
      }
      fallback('sa');
    },

    turnOnAutomation: (where, id) => {
      const msgs = where === 'build' ? get().build.msgs : get().saMsgs;
      const m = msgs.find((x) => x.id === id);
      if (!m || m.on) return;
      patchMsg(where, id, { on: true });
      addWork({ id: uid('w'), label: `Alert agent · ${m.client} reply rate < 2%`, kind: 'watch' });
      set((s) => ({
        watching: [...s.watching, { id: uid('wa'), client: m.client!, checks: 'Reply rate < 2% over 3 days', status: 'Healthy' }],
      }));
      get().toast(`Watching ${m.client} reply rate · checks every hour`, 'success');
    },

    toggleSlack: (where, id) => {
      const msgs = where === 'build' ? get().build.msgs : get().saMsgs;
      patchMsg(where, id, { slack: !msgs.find((x) => x.id === id)?.slack });
    },

    // ───────────── Action center ─────────────
    approveAction: (id) => {
      const a = get().actions.find((x) => x.id === id);
      if (!a || a.status !== 'open') return;
      set((s) => ({
        actions: s.actions.map((x) => (x.id === id ? { ...x, status: 'done' } : x)),
        watching: s.watching.map((w) =>
          w.client === a.client && w.status !== 'Healthy' ? { ...w, status: 'Healthy' } : w,
        ),
        goals:
          id === 'cobalt-bounce'
            ? s.goals.map((g) =>
                g.id === 'g-cobalt' ? { ...g, backwardNote: 'Bounce fix approved. Sending is back to 10 mailboxes from Saturday.', projection: '~28' } : g,
              )
            : s.goals,
      }));
      addWork({ id: uid('w'), label: `${a.client} · ${a.short}`, kind: 'fix' });
    },

    approveAll: () => {
      const open = get().actions.filter((a) => a.status === 'open');
      open.forEach((a) => get().approveAction(a.id));
      get().toast(`Approved ${open.length} fixes`, 'success');
    },

    dismissAction: (id) => set((s) => ({ actions: s.actions.map((x) => (x.id === id ? { ...x, status: 'dismissed' } : x)) })),

    updateAction: (id, patch) => set((s) => ({ actions: s.actions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

    undoWork: (id) => {
      const w = get().work.find((x) => x.id === id);
      set((s) => ({
        work: s.work.filter((x) => x.id !== id),
        autoFixed: s.autoFixed.map((f) => (f.id === id ? { ...f, undone: true } : f)),
      }));
      if (w) get().toast(`Undone · ${w.label}`);
    },

    simulateDisconnect: () => {
      const s = get();
      if (s.actions.some((a) => a.id === 'bp')) return s.toast('Already simulated. Use Reset demo to run it again.');
      const aut = s.autonomy;
      const extra: ActionItem[] = [];
      let fixed: AutoFix | null = null;
      if (aut.lowRisk === 'auto-undo') {
        fixed = { id: uid('af'), client: 'Brightpath Health', text: 'Paused warmup on ops@brightpath-mail.com until it reconnects', time: nowTime() };
      } else {
        extra.push({ ...BRIGHTPATH_WARMUP, status: 'open', fresh: true });
      }
      set((st) => ({
        actions: [{ ...BRIGHTPATH, status: 'open', fresh: true }, ...extra, ...st.actions],
        watching: st.watching.map((w) => (w.client === 'Brightpath Health' ? { ...w, status: 'Issue found' } : w)),
        autoFixed: fixed ? [fixed, ...st.autoFixed] : st.autoFixed,
      }));
      if (fixed) addWork({ id: fixed.id, label: 'Brightpath Health · warmup paused on 1 mailbox', kind: 'fix' });
      s.toast(`SA: ${extra.length + 1} issue${extra.length ? 's' : ''} need${extra.length ? '' : 's'} you · Brightpath Health`, 'warn');
      if (fixed) later(() => get().toast('SA fixed 1 low-risk issue on its own · undo it in the Action center'), 700);
    },

    plusWeek: () => {
      const s = get();
      const acme = s.goals.find((g) => g.id === 'g-acme');
      const base: Goal = acme ?? {
        id: 'g-acme',
        client: 'Acme HR',
        scenario: 'acme',
        title: 'Acme HR · 100 webinar registrations by Thu 20 Nov',
        current: 0,
        target: 100,
        unit: 'registrations',
        status: 'just launched',
        daysLeft: 16,
        funnel: [],
      };
      const updated: Goal = {
        ...base,
        current: 42,
        status: 'at risk',
        daysLeft: 9,
        funnel: [
          { label: 'sends', value: '1,200' },
          { label: 'opens', value: '1,050' },
          { label: 'replies', value: '58' },
          { label: 'registrations', value: '42' },
        ],
        projection: '~78',
        suggestion: true,
        adjusted: false,
      };
      set((st) => ({ goals: [updated, ...st.goals.filter((g) => g.id !== 'g-acme')], page: 'goals' }));
      s.toast('One week later · SA has a suggestion for Acme HR', 'info');
    },

    dismissSuggestion: (goalId) => set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? { ...g, suggestion: false } : g)) })),

    // ───────────── Autonomy ─────────────
    setAutonomy: (patch) => set((s) => ({ autonomy: { ...s.autonomy, ...patch } })),
    toggleLowRisk: () => {
      const next = get().autonomy.lowRisk === 'auto-undo' ? 'ask' : 'auto-undo';
      set((s) => ({ autonomy: { ...s.autonomy, lowRisk: next } }));
      get().toast(
        next === 'ask'
          ? 'Low-risk fixes: Ask me. New low-risk issues will wait for your approval.'
          : 'Low-risk fixes: Auto with undo. SA will fix them and tell you.',
      );
    },

    reset: () => {
      clearTimers();
      set({
        page: 'home',
        saOpen: false,
        saDraft: '',
        autonomyOpen: false,
        focusAction: null,
        saMsgs: saGreeting(),
        build: freshBuild(),
        ...initialData(),
        autonomy: { ...DEFAULT_AUTONOMY },
      });
      get().toast('Demo reset');
    },
  };
});

export const openCount = (actions: ActionItem[]) => actions.filter((a) => a.status === 'open').length;
