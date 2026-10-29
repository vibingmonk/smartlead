import type {
  ActionItem, AutoFix, Autonomy, Campaign, Goal, Mailbox, Scenario, ScenarioId, Watch, WorkItem,
} from './types';

// All data is fictional. Agency: Northstar Growth.
export const AGENCY = 'Northstar Growth';

export const EXAMPLES = [
  'Book 100 webinar registrations for Acme HR',
  '30 meetings for Cobalt Fintech this month',
  'Re-engage cold leads from Q2 for Dune Logistics',
];

const TONES = {
  id: 'tone' as const,
  title: 'Tone',
  options: [
    { label: 'Friendly expert', desc: 'Warm, helpful, shows you know the space' },
    { label: 'Direct', desc: 'Short, clear ask, no warm-up' },
    { label: 'Formal', desc: 'Polished and professional' },
  ],
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  acme: {
    id: 'acme',
    client: 'Acme HR',
    planTitle: 'Acme HR webinar · Campaign plan',
    target: 100,
    unit: 'registrations',
    goalNoun: 'webinar registrations',
    deadline: (q1) => (q1 === 'Other' ? 'date to be confirmed' : `by ${q1.replace(',', '')}`),
    questions: [
      {
        id: 'q1',
        title: 'Webinar date',
        options: [
          { label: 'Thu, 20 Nov', desc: '3 weeks out · enough time for 3 steps' },
          { label: 'Thu, 27 Nov', desc: '4 weeks out · US holiday week' },
          { label: 'Other', desc: "Pick later. I'll leave the date as a placeholder" },
        ],
      },
      TONES,
    ],
    defaults: { q1: 'Thu, 20 Nov', tone: 'Friendly expert' },
    audience: 'HR Directors and VPs of People · SaaS · 200–1,000 employees · US',
    audienceBig: 'HR Directors and VPs of People · SaaS · 500–1,000 employees · US',
    leads: 400,
    leadsBig: 260,
    found: 420,
    sample: [
      { name: 'Dana Whitfield', title: 'VP of People', company: 'Loopwise', size: '340', location: 'Austin, TX' },
      { name: 'Marcus Oyelaran', title: 'HR Director', company: 'Pinecrest Cloud', size: '610', location: 'Denver, CO' },
      { name: 'Hannah Kessler', title: 'Head of People', company: 'Tallyhook', size: '220', location: 'Boston, MA' },
      { name: 'Ravi Chandran', title: 'VP of People', company: 'Orbitly', size: '880', location: 'Seattle, WA' },
      { name: 'Grace Albright', title: 'HR Director', company: 'Northbeam Data', size: '450', location: 'Chicago, IL' },
    ],
    steps: [
      {
        day: 0,
        label: 'Invite',
        subject: 'Live on {date}: hiring without burnout',
        body:
          "Hi {{first_name}},\n\nHiring at {{company}} has probably picked up again, and so has the pressure on your recruiters. On {date} we're hosting a 30-minute live session with three People leaders on how they kept hiring pace without burning out their teams.\n\nYou'll leave with the exact interview loop and workload rules they use. Want me to save you a seat?\n\nBest,\nMaya at Acme HR",
      },
      {
        day: 3,
        label: 'Short bump',
        subject: 'Re: Live on {date}: hiring without burnout',
        body: 'Hi {{first_name}}, quick bump in case this got buried. Seats are filling up for {date}. Happy to send the agenda first if that helps.',
      },
      {
        day: 6,
        label: 'Last call',
        subject: 'Last call (plus the recording)',
        body: 'Hi {{first_name}}, last note from me. If {date} doesn\'t work, reply "recording" and I\'ll send it to you after the session.',
      },
    ],
    email1Direct: {
      subject: '{date}: hiring without burnout (30 min, live)',
      body:
        'Hi {{first_name}},\n\nYour recruiters are probably stretched right now. On {date}, three People leaders share how they kept hiring pace without burning out their teams.\n\n30 minutes, live. You get their interview loop and workload rules.\n\nWant a seat? Reply "yes" and I\'ll send the link.\n\nMaya, Acme HR',
    },
    step2Rewrite: {
      subject: 'The one hiring rule that saved 6 hours a week',
      body: "Hi {{first_name}}, one of our {date} speakers cut her team's interview hours by 6 a week with a single rule. She'll walk through it live. Want the link?",
    },
    middle: { label: 'opens', ratio: 2.08 },
    estFull: '~100',
    estBig: '70–80',
    estBigBoost: '95–100',
    mailboxes: 8,
    domain: 'acmehr-mail.com',
    history: "Acme HR's last 90 days",
  },
  cobalt: {
    id: 'cobalt',
    client: 'Cobalt Fintech',
    planTitle: 'Cobalt Fintech meetings · Campaign plan',
    target: 30,
    unit: 'meetings',
    goalNoun: 'meetings',
    deadline: () => 'by 30 Nov',
    questions: [
      {
        id: 'q1',
        title: 'Meeting type',
        options: [
          { label: '20-min intro call', desc: 'Low commitment, books fastest' },
          { label: 'Product demo', desc: 'Longer, higher intent, fewer bookings' },
          { label: 'Other', desc: "Tell me later. I'll keep the ask generic" },
        ],
      },
      TONES,
    ],
    defaults: { q1: '20-min intro call', tone: 'Friendly expert' },
    audience: 'CFOs and Finance Controllers · Fintech and e-commerce · 50–1,000 employees · US and UK',
    audienceBig: 'CFOs and Finance Controllers · Fintech and e-commerce · 500–1,000 employees · US and UK',
    leads: 600,
    leadsBig: 380,
    found: 780,
    sample: [
      { name: 'Olivia Brandt', title: 'CFO', company: 'Kitebox', size: '160', location: 'London, UK' },
      { name: 'Samuel Reyes', title: 'Finance Controller', company: 'Cartwheel Pay', size: '540', location: 'New York, NY' },
      { name: 'Priya Natarajan', title: 'VP Finance', company: 'Shelfspace', size: '300', location: 'Manchester, UK' },
      { name: 'Ethan Cole', title: 'CFO', company: 'Lendmark', size: '720', location: 'Miami, FL' },
      { name: 'Ava Lindqvist', title: 'Finance Controller', company: 'Parcelo', size: '95', location: 'San Diego, CA' },
    ],
    steps: [
      {
        day: 0,
        label: 'Opener',
        subject: 'Month-end close in 2 days, not 9',
        body:
          "Hi {{first_name}},\n\nMost finance teams at {{company}}'s stage spend a week reconciling payments by hand. Cobalt matches payouts, fees and refunds automatically, so close takes about 2 days.\n\nWorth a {meeting} to see if it fits your stack?\n\nBest,\nLeo at Cobalt Fintech",
      },
      { day: 3, label: 'Proof', subject: 'Re: Month-end close in 2 days, not 9', body: 'Hi {{first_name}}, Shelfspace cut their close from 8 days to 2 in the first month. Happy to show you how in a {meeting}.' },
      { day: 6, label: 'Break-up', subject: 'Should I close the loop?', body: "Hi {{first_name}}, I don't want to crowd your inbox. If reconciliation isn't a priority right now, just say so and I'll check back next quarter." },
    ],
    email1Direct: {
      subject: 'Close the books in 2 days?',
      body: "Hi {{first_name}},\n\nCobalt automates payment reconciliation, so month-end close takes 2 days instead of 9.\n\nOpen to a {meeting} this week?\n\nLeo, Cobalt Fintech",
    },
    step2Rewrite: { subject: 'How Shelfspace closes in 2 days', body: 'Hi {{first_name}}, a 2-minute case study: how Shelfspace went from 8 days to 2. Want it?' },
    middle: { label: 'positive replies', ratio: 0.025 },
    estFull: '~30',
    estBig: '20–24',
    estBigBoost: '28–30',
    mailboxes: 10,
    domain: 'cobalt-mail.io',
    history: "Cobalt Fintech's last 90 days",
  },
  dune: {
    id: 'dune',
    client: 'Dune Logistics',
    planTitle: 'Dune Logistics re-engagement · Campaign plan',
    target: 60,
    unit: 'replies',
    goalNoun: 're-engaged replies',
    deadline: () => 'by 15 Dec',
    questions: [
      {
        id: 'q1',
        title: 'Which cold leads',
        options: [
          { label: 'Opened, never replied', desc: '1,140 Q2 leads · warmer, better odds' },
          { label: 'All Q2 cold leads', desc: '2,300 leads · more volume, lower intent' },
          { label: 'Other', desc: "Describe a segment later. I'll start with openers" },
        ],
      },
      TONES,
    ],
    defaults: { q1: 'Opened, never replied', tone: 'Friendly expert' },
    audience: 'Ops and Supply Chain heads from Q2 who opened but never replied · re-verified',
    audienceBig: 'Ops and Supply Chain heads from Q2, companies over 500 employees · re-verified',
    leads: 300,
    leadsBig: 190,
    found: 1140,
    sample: [
      { name: 'Tomás Ibarra', title: 'Head of Operations', company: 'Freightlane', size: '410', location: 'Houston, TX' },
      { name: 'Claire Dunmore', title: 'VP Supply Chain', company: 'Packwell', size: '980', location: 'Columbus, OH' },
      { name: 'Jonah Feld', title: 'Ops Director', company: 'Crateworks', size: '260', location: 'Atlanta, GA' },
      { name: 'Mei Tanaka', title: 'Head of Logistics', company: 'Brightbox Retail', size: '1,200', location: 'Los Angeles, CA' },
      { name: 'Ian Parr', title: 'Supply Chain Manager', company: 'Northpine Foods', size: '530', location: 'Minneapolis, MN' },
    ],
    steps: [
      {
        day: 0,
        label: 'New angle',
        subject: 'Peak season without the overtime bill',
        body:
          "Hi {{first_name}},\n\nWe spoke briefly in Q2. Since then, Dune has helped three shippers your size cut peak-season overtime by a third with dynamic carrier routing.\n\nWorth revisiting before the December rush?\n\nBest,\nSam at Dune Logistics",
      },
      { day: 3, label: 'Bump', subject: 'Re: Peak season without the overtime bill', body: 'Hi {{first_name}}, happy to send the 1-page breakdown instead of a call if that is easier.' },
      { day: 6, label: 'Last note', subject: 'Closing the loop', body: "Hi {{first_name}}, I'll stop here. If peak season planning changes, I'm one reply away." },
    ],
    email1Direct: {
      subject: 'Cut peak-season overtime by a third?',
      body: 'Hi {{first_name}},\n\nDune cut peak overtime by a third for three shippers your size.\n\n15 minutes before the December rush?\n\nSam, Dune Logistics',
    },
    step2Rewrite: { subject: 'The 1-page peak season plan', body: 'Hi {{first_name}}, here is the plan in one page. Want it?' },
    middle: { label: 'opens', ratio: 1.55 },
    estFull: '~60',
    estBig: '38–44',
    estBigBoost: '55–60',
    mailboxes: 6,
    domain: 'dune-reach.com',
    history: "Dune Logistics' Q2 campaigns",
  },
};

export const BRIGHTPATH: Omit<ActionItem, 'status'> = {
  id: 'bp',
  client: 'Brightpath Health',
  found: 'Mailbox ops@brightpath-mail.com disconnected 12 min ago · 340 sends paused',
  why: 'Google sign-in expired (the password was changed)',
  fix: "Move today's 340 sends to 3 healthy Brightpath mailboxes and send the client admin a reconnect link",
  ignoreCost: '340 sends miss today’s window',
  gate: 'approval-send',
  sends: 341,
  credits: 0,
  rank: 3,
  short: '340 sends moved to 3 mailboxes',
  doneText: 'Fixed · 340 sends moved to 3 mailboxes · running as approved',
  timeline: [
    { t: '12 min ago', e: 'Google rejected the sign-in for ops@brightpath-mail.com' },
    { t: '12 min ago', e: '340 queued sends paused automatically to protect the domain' },
    { t: '9 min ago', e: 'Checked 3 other Brightpath mailboxes: healthy, room for 120 more sends each today' },
    { t: '8 min ago', e: 'Drafted a reconnect email for the client admin' },
    { t: 'Now', e: 'Fix ready, waiting for your approval' },
  ],
};

export const BRIGHTPATH_WARMUP: Omit<ActionItem, 'status'> = {
  id: 'bp-warmup',
  client: 'Brightpath Health',
  found: 'Warmup still running on disconnected ops@brightpath-mail.com',
  why: 'Warmup emails fail while the mailbox is disconnected, which lowers its health score',
  fix: 'Pause warmup on this mailbox until it reconnects, then resume automatically',
  ignoreCost: 'Health score drops ~4 points a day',
  gate: 'approval-fix',
  sends: 0,
  credits: 0,
  rank: 0,
  short: 'warmup paused until reconnect',
  doneText: 'Fixed · warmup paused, resumes on reconnect',
  timeline: [{ t: 'Now', e: 'Low-risk fix. Your settings say ask first, so it’s waiting for you' }],
};

const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'cobalt-bounce',
    client: 'Cobalt Fintech',
    found: 'Bounce rate 6.2% on cobalt-mail.io (limit 3%)',
    why: '180 leads from one list source are invalid',
    fix: 'Pause the domain for 48 hours, remove the 180 invalid leads and re-verify the list (60 credits)',
    ignoreCost: 'Domain reputation at risk · 4 mailboxes',
    gate: 'approval-spend',
    sends: 0,
    credits: 60,
    rank: 2,
    short: 'domain paused, list re-verified',
    doneText: 'Fixed · domain paused 48h · 180 invalid leads removed · list re-verifying',
    timeline: [
      { t: 'Yesterday 4:10 pm', e: 'Bounce rate crossed 3% on cobalt-mail.io' },
      { t: 'Yesterday 6:00 pm', e: 'Traced 92% of bounces to one imported list (“Fintech CFOs – vendor B”)' },
      { t: 'Today 8:30 am', e: 'Bounce rate now 6.2%. Fix prepared' },
    ],
    status: 'open',
  },
  {
    id: 'evergreen-reply',
    client: 'Evergreen Edu',
    found: 'Positive reply waiting 26 hours: “Can we talk Thursday?”',
    why: 'No one owns this inbox thread',
    fix: 'Drafted a reply with 2 time slots (you can edit it)',
    ignoreCost: 'Hot lead going cold',
    gate: 'approval-send',
    sends: 1,
    credits: 0,
    rank: 1,
    short: 'reply sent with 2 time slots',
    doneText: 'Sent · reply with 2 time slots · watching for the booking',
    draft:
      'Hi Priya,\n\nThursday works well. Would 11:00 am or 3:30 pm ET suit you? I’ll send a calendar invite as soon as you pick one.\n\nBest,\nJordan',
    timeline: [
      { t: 'Yesterday 10:12 am', e: 'Priya Shah (Dean of Admissions, Westbrook College) replied “Can we talk Thursday?”' },
      { t: 'Yesterday 10:13 am', e: 'Marked as a positive reply' },
      { t: 'Today 12:15 pm', e: 'No response after 26 hours. Drafted a reply' },
    ],
    status: 'open',
  },
];

const INITIAL_AUTOFIXED: AutoFix[] = [
  { id: 'af-dune', client: 'Dune Logistics', text: 'Re-queued 210 stuck sends for Dune Logistics', time: '9:14 am' },
  { id: 'af-acme', client: 'Acme HR', text: 'Paused warmup on 1 mailbox with a low health score for Acme HR', time: '8:02 am' },
];

const INITIAL_WATCHING: Watch[] = [
  { id: 'wa1', client: 'Acme HR', checks: 'Mailbox health · bounce > 3% · reply < 1.5% · stuck queue', status: 'Healthy' },
  { id: 'wa2', client: 'Brightpath Health', checks: 'Mailbox health · bounce > 3% · stuck queue', status: 'Healthy' },
  { id: 'wa3', client: 'Cobalt Fintech', checks: 'Mailbox health · bounce > 3% · reply < 1.5%', status: 'Alerting' },
  { id: 'wa4', client: 'Dune Logistics', checks: 'Mailbox health · stuck queue', status: 'Healthy' },
  { id: 'wa5', client: 'Evergreen Edu', checks: 'Positive replies waiting > 4h', status: 'Reply waiting' },
];

const INITIAL_WORK: WorkItem[] = [
  { id: 'w-cobalt', label: 'Cobalt Fintech · 30 meetings campaign', kind: 'campaign' },
  { id: 'w-dune', label: 'Dune Logistics · Q2 re-engagement campaign', kind: 'campaign' },
  { id: 'w-alerts', label: 'Alert agent · watching 5 clients', kind: 'watch' },
  { id: 'af-dune', label: 'Dune Logistics · 210 sends re-queued', kind: 'fix' },
  { id: 'af-acme', label: 'Acme HR · warmup paused on 1 mailbox', kind: 'fix' },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 'g-cobalt',
    client: 'Cobalt Fintech',
    title: 'Cobalt Fintech · 30 meetings this month',
    current: 11,
    target: 30,
    unit: 'meetings',
    status: 'at risk',
    daysLeft: 12,
    funnel: [
      { label: 'sends', value: '2,400' },
      { label: 'opens', value: '1,900' },
      { label: 'replies', value: '38' },
      { label: 'meetings', value: '11' },
    ],
    backward: [
      { label: 'meetings', value: '30' },
      { label: 'positive replies', value: '45' },
      { label: 'sends', value: '3,600' },
      { label: 'healthy mailboxes', value: '10 (6 today)' },
    ],
    backwardNote:
      '4 of 10 mailboxes are held back by the bounce issue on cobalt-mail.io. Approving that fix in the Action center gets sending back to 10 mailboxes and the goal back on track.',
    projection: '~22',
  },
  {
    id: 'g-dune',
    client: 'Dune Logistics',
    title: 'Dune Logistics · 60 re-engaged replies by 15 Dec',
    current: 34,
    target: 60,
    unit: 'replies',
    status: 'on track',
    daysLeft: 47,
    funnel: [
      { label: 'sends', value: '1,860' },
      { label: 'opens', value: '2,700' },
      { label: 'replies', value: '34' },
    ],
    projection: '~64',
  },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Fintech CFOs · reconciliation', client: 'Cobalt Fintech', status: 'Active', steps: 3, leads: 800, sent: 2400, opened: 79, replied: 1.6, positive: 11, created: 'Oct 6' },
  { id: 'c2', name: 'Q2 re-engagement', client: 'Dune Logistics', status: 'Active', steps: 3, leads: 620, sent: 1860, opened: 145, replied: 1.8, positive: 34, created: 'Oct 1' },
  { id: 'c3', name: 'Clinic managers · patient intake', client: 'Brightpath Health', status: 'Active', steps: 4, leads: 1100, sent: 3020, opened: 62, replied: 2.1, positive: 29, created: 'Sep 22' },
  { id: 'c4', name: 'Admissions deans · fall', client: 'Evergreen Edu', status: 'Active', steps: 3, leads: 450, sent: 1210, opened: 71, replied: 3.4, positive: 18, created: 'Sep 30' },
  { id: 'c5', name: 'Talent leaders · Q3 nurture', client: 'Acme HR', status: 'Completed', steps: 3, leads: 520, sent: 1560, opened: 88, replied: 2.4, positive: 21, created: 'Aug 4' },
  { id: 'c6', name: 'In-house counsel · contract AI', client: 'Granite Legal', status: 'Paused', steps: 2, leads: 300, sent: 410, opened: 54, replied: 0.9, positive: 2, created: 'Oct 14' },
  { id: 'c7', name: 'Retail ops · holiday staffing', client: 'Harbor Retail', status: 'Draft', steps: 0, leads: 0, sent: 0, opened: 0, replied: 0, positive: 0, created: 'Oct 26' },
  { id: 'c8', name: 'Robotics buyers · trade show', client: 'Ion Robotics', status: 'Active', steps: 3, leads: 260, sent: 520, opened: 66, replied: 2.7, positive: 7, created: 'Oct 18' },
];

export const MAILBOXES: Mailbox[] = [
  { email: 'maya@acmehr-mail.com', client: 'Acme HR', warmup: 98, status: 'Connected', limit: 30, sentToday: 22 },
  { email: 'team@acmehr-mail.com', client: 'Acme HR', warmup: 96, status: 'Connected', limit: 30, sentToday: 18 },
  { email: 'hello@acmehr-mail.com', client: 'Acme HR', warmup: 71, status: 'Warming', limit: 10, sentToday: 0 },
  { email: 'ops@brightpath-mail.com', client: 'Brightpath Health', warmup: 94, status: 'Connected', limit: 40, sentToday: 31 },
  { email: 'care@brightpath-mail.com', client: 'Brightpath Health', warmup: 95, status: 'Connected', limit: 40, sentToday: 12 },
  { email: 'leo@cobalt-mail.io', client: 'Cobalt Fintech', warmup: 82, status: 'Connected', limit: 30, sentToday: 26 },
  { email: 'finance@cobalt-mail.io', client: 'Cobalt Fintech', warmup: 79, status: 'Connected', limit: 30, sentToday: 24 },
  { email: 'sam@dune-reach.com', client: 'Dune Logistics', warmup: 97, status: 'Connected', limit: 35, sentToday: 30 },
  { email: 'jordan@evergreen-mail.org', client: 'Evergreen Edu', warmup: 93, status: 'Connected', limit: 30, sentToday: 15 },
  { email: 'nina@granite-legal.co', client: 'Granite Legal', warmup: 88, status: 'Connected', limit: 25, sentToday: 0 },
];

export const AGENTS = [
  {
    id: 'prospecting',
    name: 'Prospecting agent',
    does: 'Finds and previews leads that match your goal. Never spends credits without your approval.',
    status: 'Idle',
    clients: ['Acme HR', 'Cobalt Fintech', 'Dune Logistics'],
    last: 'Previewed 420 HR leaders for Acme HR · 2 days ago',
    watch: 'Tell me when Cobalt Fintech’s lead list drops below 200 unused leads',
  },
  {
    id: 'campaign',
    name: 'Campaign agent',
    isNew: true,
    does: 'Drafts sequences, picks mailboxes and sets schedules for each goal.',
    status: 'Running',
    clients: ['Cobalt Fintech', 'Dune Logistics', 'Evergreen Edu'],
    last: 'Drafted a 3-step sequence for Dune Logistics · yesterday',
    watch: 'Keep an eye on reply rate for Acme HR, tell me if it drops below 2%',
  },
  {
    id: 'deliverability',
    name: 'Deliverability agent',
    does: 'Keeps mailboxes healthy: warmup, daily limits and send windows.',
    status: 'Running',
    clients: ['All 12 clients'],
    last: 'Paused warmup on 1 Acme HR mailbox · 8:02 am',
    watch: 'Watch warmup scores for Brightpath Health, tell me if any drop below 85',
  },
  {
    id: 'reply',
    name: 'Reply agent',
    does: 'Spots positive replies and drafts responses for you to approve.',
    status: 'Running',
    clients: ['Evergreen Edu', 'Cobalt Fintech', 'Brightpath Health'],
    last: 'Drafted a reply to Priya Shah for Evergreen Edu · today',
    watch: 'Tell me if any positive reply waits more than 4 hours',
  },
  {
    id: 'alert',
    name: 'Alert agent',
    does: 'Watches health checks across clients and explains what went wrong.',
    status: 'Running',
    clients: ['5 clients'],
    last: 'Flagged a 6.2% bounce rate for Cobalt Fintech · 8:30 am',
    watch: 'Keep an eye on bounce rate for Cobalt Fintech, tell me if it goes above 3%',
  },
];

export const DEFAULT_AUTONOMY: Autonomy = { lowRisk: 'auto-undo', sendingFixes: 'ask', spend: 'ask', spendLimit: 50 };

export const INSIGHT =
  "Acme HR's step 2 reply rate is 0.9% vs 2.4% for similar campaigns. The usual cause is a weak follow-up angle. Want me to draft two alternatives?";

export function initialData() {
  return structuredClone({
    actions: INITIAL_ACTIONS,
    autoFixed: INITIAL_AUTOFIXED,
    watching: INITIAL_WATCHING,
    work: INITIAL_WORK,
    goals: INITIAL_GOALS,
    campaigns: INITIAL_CAMPAIGNS,
  });
}
