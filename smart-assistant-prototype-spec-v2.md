# Smart Assistant prototype spec (v2): goal-based, semi-autonomous

> **Purpose:** a clickable, mid-fidelity prototype for a SmartLead PM interview pitch. It shows **only the future version** of Smart Assistant (SA), with no "today vs. proposed" comparison.
>
> **The one idea it must land in under 3 minutes:** you give SA an outcome, it builds the whole plan in front of you by orchestrating SmartLead's agents, and you approve once. After launch it watches everything and brings you fixes to approve. SA is semi-autonomous: it drafts and prepares automatically, and **you approve anything that sends or spends.**
>
> Hand this whole file to Claude Code. Build what's here; anything not listed is out of scope.

---

## 1. What the prototype must show

| Vision element | Where it appears |
|---|---|
| **Goal-based outcome:** type what you want to achieve, not steps | Goal composer (Home) → Build view |
| **Building via chat**, like Lovable or Claude: chat on one side, the thing being built on the other | Build view (split screen) |
| **SA orchestrates agents:** Prospecting, Campaign, Deliverability, Reply and Alert agents each do their part | Agent steps on the build canvas |
| **Approve once:** one plan, one approval, cost shown up front | Approval bar |
| **Iterate in chat:** "make it more direct" updates the plan live | Build view, edit loop |
| **Semi-autonomous:** clear lines between what SA does alone and what needs you | Autonomy settings + gate badges |
| **SA speaks first:** problems arrive with a diagnosis and a ready fix | Action center |
| **Owns the outcome:** progress against the goal, with suggested adjustments | Goal tracker |
| North star: **Active SA work** | Counter in the SA header |

---

## 2. Tech and build rules

- **Stack:** React + TypeScript + Vite + Tailwind, as a single-page app. No backend and no login.
- **Data and responses:**
  - All data is mocked in `src/data/*.ts`.
  - All SA responses are **scripted and deterministic**, with no LLM calls, so the live demo can't fail.
  - Free-text input is keyword-matched to scripted flows. If nothing matches, show suggestion chips.
- **Streaming feel:** SA text appears word by word (about 20 ms per word). Canvas steps animate from `Planning…` to `Ready` one after another, 600–900 ms apart, so the audience sees agents working.
- **State:** in memory (Zustand or React context). Provide a "Reset demo" control.
- **Branding:**
  - Use a plain text wordmark "SmartLead" and a visible **"Prototype · mock data"** badge.
  - Do not copy SmartLead's or Apollo's logos or assets.
  - Take *patterns* from the inspiration (see section 4), not visuals.
- **Theme:** dark by default (near-black surfaces, soft grey borders, one bright accent, e.g. lime/yellow, for primary actions), with a light-mode toggle. Font: Inter.
- **Layout:** desktop-first at 1440×900, and must work at 1280 wide.
- **Output:** `npm run build` produces static files deployable to Vercel or Netlify.

---

## 3. App shell

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ SmartLead  [Prototype · mock data]   Client: [All clients ▾]   ⚡ Action center (3)  ⚙ │
├──────────┬────────────────────────────────────────────────────────────────────┤
│ Home     │                                                                    │
│ Goals    │                     Page content                                   │
│ Campaigns│                                                                    │
│ Email    │                                                                    │
│ accounts │                                                                    │
│ Action   │                                                                    │
│ center   │                                                                    │
│ Agents   │                                                                    │
└──────────┴────────────────────────────────────────────────────────────────────┘
```

- **Agency:** "Northstar Growth", 12 fictional clients (Acme HR, Brightpath Health, Cobalt Fintech, Dune Logistics, Evergreen Edu and others).
- **SA header widget** (top bar, next to Action center): "**Active SA work: N running**". Clicking it opens a popover listing the running items, each with an Undo button, and the line: *"Counts work in use, not chat. Anything undone or paused drops out."*

---

## 4. Patterns to borrow (from Lovable, Claude and Apollo)

- **Lovable / Claude artifacts:** split screen with the conversation on the left and a live, updating output on the right. Each chat turn visibly changes the output. Show a small "Updated" highlight on whatever changed.
- **Apollo assistant:**
  - **Single-choice option cards** with a title, a one-line description, radio buttons and a **Continue** button. Use these for every clarifying question.
  - A **summary card** at the top of a built object, with a title and type (e.g. "Acme HR webinar · Campaign plan").
  - A **"When this happens → Then do this" canvas** of connected step cards. Reuse this layout for plans and automations.
- **Never** show tool or API names. Everything is plain language.

---

## 5. Screens and flows

### 5.1 Home: goal composer

- **Hero:** "What do you want to achieve?", with a large input that says "Describe an outcome, e.g. *30 demos for Cobalt Fintech this month*".
- **Example chips below** (clicking one fills the input):
  - "Book 100 webinar registrations for Acme HR"
  - "30 meetings for Cobalt Fintech this month"
  - "Re-engage cold leads from Q2 for Dune Logistics"
- **Below the hero, two compact panels:**
  - **Needs you (3):** the top 3 items from the Action center, each with an inline "Review fix" button.
  - **Active goals:** progress cards (see 5.5).

Submitting a goal opens the **Build view**.

### 5.2 Build view: goal → plan, built live via chat (the wedge)

```
┌──────────────── Chat (40%) ────────────────┬──────────── Plan canvas (60%) ─────────────┐
│ You: Book 100 webinar registrations for     │  [Summary card]                            │
│      Acme HR                                │  Acme HR · Webinar campaign · Goal: 100     │
│                                             │  registrations by 20 Nov                   │
│ SA: Got it. Two quick choices, then I'll    │                                            │
│     build the plan.                         │  ◉ GOAL                                    │
│ [Option card: Webinar date ...] [Continue]  │  100 registrations                         │
│                                             │        │                                   │
│ SA: Building your plan…                     │  ① Prospecting agent   Ready ✓             │
│   ✓ Found 420 matching leads, picked 400    │        │                                   │
│   ✓ Drafted 3-step sequence                 │  ② Campaign agent      Ready ✓             │
│   ✓ Picked 8 healthy mailboxes              │        │                                   │
│   ✓ Set up monitoring                       │  ③ Deliverability agent Ready ✓            │
│                                             │        │                                   │
│ [Next steps chips]                          │  ④ Alert agent         Ready ✓             │
│ ─────────────────────────────────────────── │                                            │
│ [Composer: "Change anything…"]              │ ┌──────── Approval bar (sticky) ─────────┐ │
│                                             │ │ 400 credits · 1,200 sends over 2 weeks │ │
│                                             │ │ [Edit]   [Approve & launch]            │ │
│                                             │ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┴────────────────────────────────────────────┘
```

**Step 1: clarify once.** SA sends **one** message holding up to 2 option cards in the Apollo style, with defaults preselected:

- **Webinar date:** `Thu, 20 Nov` (selected) / `Thu, 27 Nov` / Other
- **Tone:** `Friendly expert` (selected) / Direct / Formal
- One **Continue** button for both.

**Step 2: SA builds the plan live.** The chat streams a checklist while the canvas fills top-down. Each canvas node appears as `Planning…` and turns into `Ready ✓` with its content:

1. **Goal node:** "100 registrations by Thu 20 Nov". Underneath, the funnel maths built from Acme HR's last 90 days: *100 registrations ← ~2,500 opens ← 1,200 sends ← 400 leads × 3 steps*. Label it "estimate".
2. **Prospecting agent:**
   - "400 HR Directors and VPs of People · SaaS · 200–1,000 employees · US"
   - A preview table of 5 sample leads (fake names and companies)
   - Cost chip: `400 credits`
   - Gate badge: `Needs approval · spend`
3. **Campaign agent:**
   - A 3-step sequence. Each step is an expandable card with a subject and body, editable inline.
     - Day 0: "Live on 20 Nov: hiring without burnout"
     - Day 3: a short bump
     - Day 6: last call, plus a recording offer
   - Gate badge: `Auto · draft`
4. **Deliverability agent:**
   - "8 healthy mailboxes · warmup score 92–98 · 30/day each"
   - "Send window: Tue–Thu 9–11 am, lead's local time"
   - Gate badge: `Auto`
5. **Alert agent:**
   - "Watching: mailbox health, bounce rate > 3%, reply rate < 1.5%, stuck queue"
   - "Checks every hour · times shown in IST"
   - Gate badge: `Auto · watch`

**Step 3: approve once.** A sticky **Approval bar** at the bottom of the canvas shows:

- "**400 credits · 1,200 sends over 2 weeks**"
- Two gate icons: "spends credits" and "sends email"
- Buttons: secondary `Edit`, primary **`Approve & launch`**

Clicking it opens **one** confirmation modal that summarises cost and send volume, with a **Confirm** button. This is the only approval in the flow.

**Step 4: after launch.**

- The canvas status chips turn to `Running`.
- A **"Running as approved"** strip shows green ticks for leads 400/400 · sequence 3 steps · 8 mailboxes · Tue–Thu 9–11 lead-local · 400 credits.
- Chat **Next steps** chips: "Track this goal" (→ Goals), "Show what needs me" (→ Action center), "Watch reply rate weekly".
- The Active SA work counter goes up by 2 (the campaign and the monitoring).

**Edit loop (Lovable-style).** Before approving, the user can type into the chat:

- **"Make the tone more direct and shorten email 1"** → the Campaign agent node re-renders with the new copy and a yellow "Updated" highlight for 2 seconds. The chat replies: "Shortened email 1 to 62 words and switched to a direct tone."
- **"Only companies over 500 employees"** → the Prospecting node updates to 260 leads at 260 credits. The funnel recalculates and the approval bar updates. SA warns: "That gets you an estimated 70–80 registrations. Add 2 more mailboxes to keep the goal? (no cost)". Chips: "Add mailboxes" / "Keep as is".

### 5.3 Action center: fix and approve (semi-autonomous ops)

This is a full page, reachable from the top bar (badge count) and the left nav. It's an inbox of issues across clients that SA found itself.

**Three sections:**

1. **Needs your approval (3)**, ranked by cost if ignored. Each item is a card:

| Client | What SA found | Why (diagnosis) | Proposed fix | Gate |
|---|---|---|---|---|
| Brightpath Health | Mailbox `ops@brightpath-mail.com` disconnected 12 min ago · 340 sends paused | Google sign-in expired (password changed) | Move today's 340 sends to 3 healthy Brightpath mailboxes and send the client admin a reconnect link | `Needs approval · send` |
| Cobalt Fintech | Bounce rate 6.2% on `cobalt-mail.io` (limit 3%) | 180 leads from one list source are invalid | Pause the domain for 48 hours, remove the 180 invalid leads, re-verify the list (60 credits) | `Needs approval · spend` |
| Evergreen Edu | Positive reply waiting 26 hours: "Can we talk Thursday?" | No one owns this inbox thread | Drafted reply with 2 time slots (editable) | `Needs approval · send` |

Each card has a primary **Approve fix**, plus *Edit*, *Dismiss* and an expandable "See details" (a mini timeline of what happened). There is also a **Approve all (3)** button with a confirmation listing the total sends and credits.

2. **Fixed automatically (2)**, low-risk items handled under the user's autonomy settings, each with an Undo button:
   - "Re-queued 210 stuck sends for Dune Logistics · 9:14 am"
   - "Paused warmup on 1 mailbox with low health score for Acme HR · 8:02 am"

3. **Watching:** a compact list of active Alert agents per client, with their status.

**After approval:** the card animates to a "Done" state: *"Fixed · 340 sends moved to 3 mailboxes · running as approved"*. The section count drops, and Active SA work goes up.

**Demo trigger:** a hidden demo control, "Simulate: mailbox disconnects". It adds the Brightpath card live, with a toast ("SA: 1 issue needs you · Brightpath Health") and a badge bump, so the audience sees SA **speak first**.

### 5.4 Autonomy settings: the semi-autonomous design

Opened from ⚙ in the top bar or via a "Change what SA can do alone" link in the Action center. It is one simple table, per agency, with an option to override per client:

| Action type | Example | Setting |
|---|---|---|
| Draft and prepare | Write sequences, build lead lists (preview), plan schedules | **Auto** (locked) |
| Low-risk fixes | Re-queue stuck sends, pause warmup on unhealthy mailbox | **Auto with undo** / Ask me |
| Fixes that change sending | Move volume between mailboxes, pause a domain | Auto with undo / **Ask me** |
| Send email | Launch campaigns, send replies | **Ask me** (locked) |
| Spend credits | Find or verify leads | **Ask me** / Auto under [__] credits/day |

Footer line: *"SA never sends without your approval. Everything SA does on its own can be undone."*

Changing "Low-risk fixes" to *Ask me* moves future items in the Action center from "Fixed automatically" into "Needs your approval".

### 5.5 Goals: owning the outcome

A list of goal cards, one per active goal. Each card shows:

- **Title:** "Acme HR · 100 webinar registrations by 20 Nov"
- **Progress bar:** 42 / 100 · *on track* (green) / *at risk* (amber)
- **Funnel:** 1,200 sends → 1,050 opens → 58 replies → 42 registrations
- **SA weekly suggestion card** (from demo control "+1 week"), e.g.:
  > "You're at 42/100 with 9 days left, which tracks to about 78. Reply rate on step 2 is half of step 1. I'd rewrite step 2 and add 150 leads from the same segment (150 credits). That gets you to roughly 100."
  - Buttons: **Approve changes** (spend gate) / See plan / Not now
  - Approving opens the Build view with only the changed nodes highlighted, plus the approval bar.

Cobalt Fintech's "30 meetings this month" goal card should also exist, marked *at risk*. Clicking it shows the backward funnel (meetings ← positive replies ← sends ← mailboxes).

### 5.6 Agents page: one front door, many agents

A simple grid of agent cards. Each card shows name, what it does, status, the clients it runs for, and its last action.

- **Prospecting agent:** finds and previews leads
- **Campaign agent** (badge *New*): drafts sequences, picks mailboxes and sets schedules
- **Deliverability agent:** mailbox health, warmup, send windows
- **Reply agent:** detects positive replies and drafts responses
- **Alert agent:** watches the checks and diagnoses issues

Subtitle: *"You don't need to manage these. Tell SA what you want; it runs the right agents."* Each card has a "Watch this for me" entry that opens the SA chat prefilled.

---

## 6. SA chat behaviour (global)

- SA opens as a **right-side panel** on any page (top-bar button or ⌘K), and as the left pane of the Build view.
- **Every SA response ends with 2–3 clickable next-step chips.** There are no dead-end replies.
- Clarifying questions arrive **once, together**, as option cards with defaults selected.
- Gate badges come in three styles, used consistently everywhere:
  - `Auto` (grey)
  - `Auto with undo` (blue)
  - `Needs approval · send` / `· spend` (amber)
- **"Watch this for me":** typing "Keep an eye on reply rate for Acme HR, tell me if it drops below 2%" returns an **automation card** in the "When this happens → Then do this" style:
  - **When:** reply rate on any Acme HR campaign < 2% over 3 days
  - **Then:** alert me in-app + email (Slack toggle) and propose a fix
  - **Runs:** every hour · next runs at 3:00, 4:00, 5:00 pm IST
  - Button: "Turn on" (`Auto · watch`)
- **Expert voice example**, a proactive insight card that can appear in chat: *"Acme HR's step 2 reply rate is 0.9% vs 2.4% for similar campaigns. The usual cause is a weak follow-up angle. Want me to draft two alternatives?"*

---

## 7. Demo controls

A floating panel at bottom-left, toggled with the `D` key and hidden by default:

- Start goal: Acme HR webinar
- Simulate: mailbox disconnects
- +1 week (goal progress and suggestion)
- Toggle autonomy: low-risk fixes Auto ↔ Ask me
- Reset demo

---

## 8. Suggested 3-minute demo script

1. **Home (15s):** "SmartLead opens on one question: what do you want to achieve?"
2. **Build view (75s):**
   - Type the webinar goal and answer one option card.
   - Watch four agents build the plan live, then tweak the tone in chat and see the plan update.
   - Approve once. "One approval. Cost and sends shown up front. It runs exactly as approved."
3. **Action center (50s):**
   - Simulate the disconnect. "I didn't ask; SA found it, diagnosed it and has a fix ready."
   - Approve. Show the "Fixed automatically" items with Undo.
4. **Autonomy settings (20s):** "Semi-autonomous by design: SA drafts and does low-risk fixes alone; sending and spending always need me."
5. **Goals (20s):** +1 week. SA says I'm tracking to 78 of 100 and proposes how to close the gap. "SA owns the outcome, not just the task."

---

## 9. Acceptance criteria

- [ ] Goal to launched campaign takes **one** option card and **one** approval.
- [ ] Canvas nodes build sequentially with visible agent names and Planning → Ready states.
- [ ] An edit typed in chat updates only the affected canvas nodes, with an "Updated" highlight, and recalculates cost and funnel.
- [ ] Every SA response ends with clickable next steps.
- [ ] Every action shows a gate badge, and the approval bar always shows credits and sends before approval.
- [ ] Simulated issues appear in the Action center without user input, with toast and badge.
- [ ] The Autonomy setting changes where future issues land (auto-fixed vs. needs approval).
- [ ] Active SA work updates correctly on approve, auto-fix, watch and undo.
- [ ] No API or tool names appear anywhere.
- [ ] "Reset demo" restores the initial state, and `npm run build` succeeds with no console errors.

## 10. Out of scope

Real auth, real sending, real SmartLead or Apollo APIs, LLM calls, mobile layouts, billing, the full master inbox, and settings beyond the Autonomy table.
