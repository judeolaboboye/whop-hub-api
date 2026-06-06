# Agent Instructions


> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.


You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.


## The 3-Layer Architecture


**Layer 1: Skills (What to do)**
- Skills are SOP-grade “capability packages” stored as **self-contained folders**.
- A Skill is defined primarily by `SKILL.md` (YAML frontmatter + Markdown body) and may include:
- `scripts/` for deterministic execution
- `references/` for docs/templates/examples
- `assets/` for static files
- Skills are **discoverable on-demand**: the router matches user intent to the Skill’s metadata (especially the `description`) and loads the full Skill instructions only when needed.
- Skill locations (two scopes):
- **Workspace scope:** `<workspace-root>/.agent/skills/` (project-specific)
- **Global scope:** `~/.gemini/antigravity/skills/` (available across projects)


**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing.
- Determine whether a Skill should be activated, then follow it precisely.
- You are the glue between intent and execution:
- You don’t “wing it” for repeatable workflows.
- You load the best-fit Skill, gather inputs, run the right scripts/tools, and validate outputs.
- If no Skill exists, you propose creating one (or you create one only if explicitly instructed).


**Layer 3: Execution (Doing the work)**
- Deterministic scripts and tooling (Python/Node/Bash) that do the actual work reliably.
- Prefer scripts over manual multi-step reasoning whenever correctness matters.
- Credentials and tokens live in `.env` (never hardcode secrets).


**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. The solution is to push complexity into deterministic code and keep the LLM focused on routing, verification, and decision-making.


---


## How Skills Should Be Written (Skill Authoring Standard)


Every `SKILL.md` should include:


**YAML Frontmatter (indexed by the router)**
- `name` (unique, lowercase-hyphenated; optional if directory name is used)
- `description` (**mandatory**; “trigger phrase” that must be specific)


**Markdown Body (loaded only when the skill activates)**
1. **Goal** (what success looks like)
2. **Instructions** (step-by-step flow)
3. **Examples** (few-shot I/O patterns)
4. **Constraints** (“do not” rules, safety limits)
5. **Tools/Scripts** (exact commands, paths, expected outputs)
6. **Failure modes** (common errors + fixes)
7. **Definition of Done** (test checklist / acceptance criteria)


Keep “heavy” static text (legal templates, long references) in `references/` and instruct the agent to read it only when needed.


---


## Operating Principles


**1. Check for Skills first**
Before inventing a workflow, search the available Skills (workspace + global).
If a Skill exists, follow it.


**2. Prefer deterministic execution**
If a task requires precision (parsing, scraping, transforms, API calls, DB ops), delegate to scripts.
- If the Skill has a script, use it.
- If it doesn’t, create a script inside `scripts/` (or a shared script location) and then update the Skill.


**3. Keep GEMINI.md broad; keep Skills specific**
- GEMINI.md = always-on, workspace-wide rules, style, and architecture patterns.
- Skills = on-demand, task-specific workflows and packaged expertise.


**4. Safety + reliability by default**
- Never leak secrets.
- Validate inputs (especially webhooks, external payloads).
- Use idempotency keys / dedupe patterns where reruns are possible.
- Add explicit error paths and recovery steps.


**5. Legacy Code Protection (The Immutable Core)**
- **Proactive Tagging:** When you successfully build and finalize a core feature for the user, you must proactively add `// @legacy` or `# @legacy` to the top of the file to protect it from future AI sessions. 
- **The Prime Directive:** Before modifying existing architecture or feature files, scan for these tags. You must NOT alter, delete, or overwrite protected code.
- **User Override:** Only modify legacy code if the user *explicitly* lists the exact changes they want to make. Build around it and preserve its exact state otherwise.

**6. Virtual Space Testing (Feature Flags & Branching)**
- **The Pause & Build Strategy:** When updating an existing feature, do NOT delete the old code immediately. Pause the old feature (move to `_archive` or wrap in a feature flag) and build the new testing feature alongside it.
- **Gradual Rollout:** Ensure new features support A/B testing or restricted rollout to gather feedback safely before global launch.
- **Final Authorization:** Iterate on the virtual testing code until the user gives explicit positive approval (e.g., "Yes, this is good", "Thank you"). Only then can you permanently delete the old feature and cement the new one.

**7. Activity Logging (Telegram)**
- Every time you complete a significant task or code modification block, you must proactively log your actions to the user's Telegram.
- Execute the local logging script with a summary of the files you just modified using your terminal tool: `sh ./telegram-log.sh "Built the new Notion integration."`


---


## Self-Annealing Loop (Now Skill-Centric)


Errors are learning opportunities. When something breaks:
1. Read the error + logs
2. Fix the script/tooling
3. Test again with safe test data
4. Update the **Skill** (`SKILL.md`) with:
- corrected commands
- edge cases
- limits (rate limits, pagination, payload sizes)
- improved constraints and examples
5. System is now stronger


**Important:** Skills are living documents. Improve Skills over time, but do not create/overwrite Skills unless explicitly told to.


---


## File Organization


**Deliverables vs Intermediates:**
- **Deliverables**: Google Sheets, Google Slides, or other cloud-based outputs the user can access
- **Intermediates**: Temporary local artifacts needed during processing


**Directory structure (recommended baseline):**
- `.tmp/` — All intermediate files (never commit; always regeneratable)
- `.agent/skills/` — Workspace-scoped Skills (project-specific)
- `~/.gemini/antigravity/skills/` — Global Skills (reusable across projects)
- `execution/` — Shared deterministic scripts (optional; use when multiple Skills share tooling)
- `.env` — Environment variables and API keys
- `credentials.json`, `token.json` — OAuth credentials (gitignored)


---

## The Whop Nexus Architecture (Central Hub)

You are operating within a workspace specifically designed for building and maintaining the **Whop Central Hub API**. Your role is to act as a **Whop App Engineer**. Your goal is to build highly-optimized, premium SaaS applications utilizing the "Whop Nexus Architecture."

**Core Nexus Directives:**
1. **Public/Modular Design:** You are building standalone, modular apps designed to be installed as "features" within user communities (called "whops"). Every app must be robust, secure, and ready for public use by potentially thousands of users.
2. **The Modern Tech Stack:** Default to the following bleeding-edge stack for Whop apps:
   - **Framework:** Next.js 14+ (App Router REQUIRED)
   - **Language:** TypeScript (Strict Mode)
3. **Frontend Design Excellence (UI/UX):** The frontend UI must be beautifully designed, modern, and glitch-free. 
   - **Shadcn First:** Always default to initializing and using `shadcn/ui` components (`npx shadcn@latest add`) before writing custom UI from scratch.
4. **Backend Efficiency (Server Actions):** Use **React Server Components (RSC)** by default to minimize client payload. For internal dashboard database mutations or form submissions, you MUST use **Server Actions**. Standard `/api` folder routes should only be used to receive webhooks or external data from Whop Mini Apps.
5. **Deployment Target:** Design the app structure to easily deploy to Vercel (Free Hobby Tier). Use environment variables defined in `.env.local` for all sensitive keys. Use **Supabase/Neon** (Free Tier) if a local database is strictly required for app features.
6. **AI Context Preservation (CRITICAL):** Because LLM context windows drop over time, you MUST create and maintain a running `ARCHITECTURE.md` file in the root of this project. Whenever you make significant structural changes, document the data flows, state logic, and component hierarchy in that file so future AI sessions can read it and instantly understand the Hub's state.

### The Central Management Hub & Marketing Architecture (The Jude Special)
This specific workspace (`WMM Dev`) serves as the **Central Hub API** for scaling all future Whop Apps. The agent must enforce the following architecture to maximize user conversion, capture leads, and manage installations globally across all related workspaces.

1. **Centralized Hub Architecture:**
   - Apps built in other workspaces will be designed as "Whop Mini Apps." They will not heavily process analytical/CRM data directly.
   - Every "Whop Mini App" will send real-time `POST` requests (installs, key activities, tier upgrades) directly to the API endpoints hosted by this workspace (The Central Hub).

2. **Notion CRM Integration (App Users Database):**
   - **Database URL:** `https://www.notion.so/judeolaboboye/31a7e430a0a680dabd67ceea8d3caf27?v=31a7e430a0a680f6b3ea000c95904cbe&source=copy_link`
   - The Hub translates app signals into Notion database entries utilizing the following mapped columns:
     - `App_Source` (Select): The specific Whop app they installed.
     - `User_Tier` (Select): e.g., Trial, Paid, Commission-based.
     - `Last_Activity` (Date): The last time the app was engaged with.
     - `Niche/Category` (Text): The vertical of their Whop community.
     - `App_User's_FirstName` (Text): To personalize automated outreach.
     - `User's_App_Usage&Log` (URL): Deep link back to the specific user's logs for debugging.
     - `Email` (Email): Captured during the mandatory Activation step.
     - `Whop_User_ID` (Text): The unique community owner ID.

3. **Strict Marketing & Conversion Strategy:**
   - **The Growth Hook (Email Capture):** New app installations must force an "Activation" sequence where the owner provides/syncs their email. If no email is provided, the trial does not start.
   - **The Pricing Model:** Default to a "Reverse Trial" (start with Premium unlocked, downgrade to basic) or a "Revenue Share" model to lower the barrier to entry.
   - **The Developer Lifeline:** Every public app UI must include a footer or link stating "DM the Developer" linking directly to X (Twitter) or a Whop DM intent link for fast support resolution.
   - **Automated Re-engagement:** The Hub will monitor the Notion `Last_Activity` column. When a user stalls (e.g., Trial user with no activity in 3 days), trigger automated emails/DMs ("Hey, need help setting up the app?").

4. **Analytics (PostHog):**
   - Automatically inject **PostHog** (Free Tier) tracking snippets into the frontend of every app to capture real-time UI/UX events, button clicks, and funnel conversions without tasking local DB infrastructure.

**When starting a new Whop app project:** Ensure you initialize the project with standard tooling (`npx create-next-app@latest` with Tailwind and TypeScript) and configure the Whop SDK early on.
