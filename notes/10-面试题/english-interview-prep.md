# English Interview Preparation — Linfeng Pan

---

## 1. Self-Introduction (1–2 Minute Elevator Pitch)

> Hi, I'm Linfeng Pan. I've been a frontend engineer for over seven years, focused primarily on React, Next.js, and TypeScript. I spent most of that time at Thoughtworks, where I worked with global clients — Porsche and REA Group being the primary ones.
>
> At Porsche, I served as the frontend lead for their dealer management system, which ran across four platforms: WeChat Mini Program, Douyin Mini Program, H5, and Web Admin. One highlight from that project was leading the migration from WeChat to Douyin Mini Program, where we achieved roughly 70% code reuse despite significant API compatibility challenges.
>
> Following that, I joined REA Group, which operates Australia's largest real estate platforms. I worked on both the Next.js frontend and the Node.js BFF layer, with daily standups alongside engineers in Melbourne and India. That role is also where I began integrating AI-assisted development seriously. I built custom Agent Skills on Claude Code that covered our full workflow, from requirement analysis through code review and CI/CD.
>
> I'm now looking for a role where I can continue working with modern frontend technologies, ideally in an English-speaking environment that values both technical depth and cross-cultural collaboration.

---

## 2. Behavioral Questions — STAR-Format Talking Points

### Q: Tell me about a challenging project.

**Map to:** Porsche WeChat → Douyin Mini Program Migration

- **Situation:** Porsche's dealer system was built as a WeChat Mini Program using TaroJS. The business needed to expand to Douyin (TikTok China) to reach a broader set of dealers.
- **Task:** Migrate the existing mini program while preserving as much of the codebase as possible. A full rewrite was not feasible within the timeline.
- **Action:** I began by auditing Taro API compatibility between the two platforms. Several core APIs behaved differently or were not supported on Douyin at all. The animation system was particularly problematic — it performed well on WeChat but degraded noticeably on Douyin. I worked through each incompatible API case by case, then rewrote the animation layer using lower-level primitives and built a shared abstraction that both platforms could rely on.
- **Result:** We reached roughly 70% code reuse. Equally important, we documented every compatibility issue and its resolution, which became the team's reference for all subsequent cross-platform migrations.

### Q: Tell me about a time you led a technical initiative.

**Map to:** Cross-platform component library or AI engineering pipeline

- **Situation:** At Porsche, four separate platforms — WeChat, Douyin, H5, Web Admin — each had teams independently building similar UI components: vehicle cards, dealer selectors, form components. This led to inconsistent user experience and duplicated effort.
- **Task:** Build a single component library that could serve all four platforms.
- **Action:** I established a Lerna + Yarn Workspace monorepo, designed component APIs compatible with Taro's multi-platform compilation, and led the team through building and documenting 15+ business components. Each component had to encapsulate platform-specific behavior while exposing a consistent interface.
- **Result:** The library eliminated redundant UI development across teams. Components were built once and available on all four platforms. New features shipped simultaneously everywhere.

### Q: How do you handle disagreements in code review?

**Map to:** Thoughtworks engineering culture

- **Situation:** Thoughtworks has a strong code review culture. I both reviewed others' code and had my own work reviewed daily, at times by engineers in Australia and India with differing perspectives.
- **Action:** I make a point of separating style preferences from substantive concerns. For style disagreements, I reference the ESLint configuration — if the linter does not flag it, it is usually not worth debating. For actual technical concerns, I ask the reviewer to walk me through the scenario they are worried about. On many occasions they caught edge cases I had not considered. When I believe my approach is the correct one, I explain my reasoning with concrete examples rather than simply stating a preference.
- **Result:** I have found that approaching review as a conversation rather than a defense makes a meaningful difference. At Porsche, I formalized this into our process: every review comment needed to include either a specific suggestion or a clarifying question. Vague feedback became rare.

### Q: Describe a time you solved a production issue.

**Map to:** REA Group incident response

- **Situation:** At REA Group, a deployment caused a critical page on realcommercial.com.au to throw errors, affecting real users browsing commercial property listings.
- **Task:** Diagnose and resolve the issue as quickly as possible to restore service.
- **Action:** I traced the error through our monitoring dashboards, identified the problematic component, and found the root cause: a data structure change in the BFF API that the frontend was not handling — a null safety issue. I rolled back the change first to restore service, then coordinated with the backend team to align the API contract, added proper null handling on the frontend, and wrote a regression test.
- **Result:** Service was restored within 30 minutes. The regression test was incorporated into the CI pipeline, ensuring the same class of error would be caught before deployment going forward.

### Q: How do you learn new technology?

**Map to:** AI-assisted development journey

- **Situation:** When AI coding tools became practical around 2023-2024, I wanted to move beyond using them as enhanced autocomplete and understand how to integrate them meaningfully into real development workflows.
- **Action:** I began experimenting with Claude Code on daily tasks, observing where it was effective and where it was not. It proved strong at generating test cases and boilerplate, but required tight constraints for business logic. Over time I built custom Agent Skills that encoded these patterns: one for breaking down requirements into implementable units, one for generating tests, one for code review. Each included specific prompts and guardrails derived from practical experience.
- **Result:** What began as a personal experiment was eventually adopted by the broader team. The testing skill in particular had a measurable impact on test coverage, primarily by reducing the overhead of writing tests from scratch.

### Q: Tell me about a time you had to collaborate across cultures or time zones.

**Map to:** REA Group Australia-India-China collaboration

- **Situation:** At REA Group, our team spanned three countries: Australia (Melbourne), India, and myself in China. This meant meaningful time zone gaps and differences in communication norms.
- **Action:** I adjusted my schedule so my afternoons overlapped with Melbourne mornings for standups and pairing sessions. For asynchronous communication, I learned to be considerably more explicit in writing. Chinese work culture sometimes relies on implicit understanding, which does not translate well to international teams. I began writing detailed PR descriptions and recording screen demonstrations of my changes. I also made an effort to join informal team interactions — group chats, virtual coffee breaks — which helped establish rapport across the distance.
- **Result:** Despite the time differences, we maintained a consistent delivery cadence. My tech lead in Australia specifically highlighted my communication as a strength during performance reviews. It was not simply about English proficiency — it was about adapting my communication style to the context.

---

## 3. Technical Deep-Dive Questions

### React

**Q: Explain how React Fiber works and why it matters.**
- Fiber is React's reconciliation engine, introduced in React 16. The core concept: rendering work is broken into small units that can be paused and resumed.
- Before Fiber, reconciliation was synchronous — once a render began, it blocked the main thread until completion.
- Fiber uses a linked list data structure (each node has `child`, `sibling`, `return` pointers), allowing React to traverse the component tree incrementally.
- Updates are assigned priorities — user input receives high priority, data fetch responses lower. React can yield to the browser between units to maintain responsiveness.
- The practical outcome: features like `Suspense`, `useTransition`, and concurrent rendering are all built on Fiber.

**Q: Walk me through the useEffect cleanup function.**
- The cleanup function runs in two cases: before the effect re-executes due to dependency changes, and when the component unmounts.
- Common use cases: clearing timers and intervals, canceling subscriptions, aborting in-flight fetch requests, removing event listeners.
- A notable detail: in React 18 Strict Mode (development only), effects mount, unmount, then remount to surface missing cleanups. If an application breaks in Strict Mode, a missing cleanup is often the cause.
- The cleanup function captures the previous render's closure. Without care, you may clean up using stale data. Refs can help when the latest value is needed inside a cleanup.

**Q: How would you optimize a React app with rendering performance issues?**
- Begin by measuring. React DevTools Profiler identifies which components re-render and why.
- `React.memo` for pure components that re-render on parent updates with unchanged props.
- `useMemo` and `useCallback` for expensive computations and stable function references — applied selectively, as they carry their own cost.
- Move state downward. A state change should not cause large subtrees that do not depend on it to re-render.
- `useTransition` for non-urgent updates, preventing the UI from blocking on expensive renders.
- Virtualization (react-window or react-virtuoso) for long lists.
- Code splitting with `React.lazy` + `Suspense` to reduce initial bundle size.

### Cross-Platform Development

**Q: How does TaroJS compile to multiple platforms?**
- Taro takes a compile-time approach: you write in React or Vue syntax, and Taro's compiler transforms the code into platform-specific output.
- For mini programs, React components are mapped to mini-program templates (WXML for WeChat), and the React event system is mapped to mini-program events.
- The runtime includes a lightweight React-like reconciler that executes within the mini program's JavaScript engine.
- The key limitation: mini program environments lack standard browser and DOM APIs. Taro provides polyfills and abstractions, but edge cases are inevitable — which is precisely what we encountered during the Douyin migration.

**Q: What were the main differences between WeChat and Douyin mini programs in practice?**
- API namespace differences: identical functionality, different signatures or module names. Taro abstracts most of this, but certain platform-specific APIs still surface.
- Animation performance was the most significant gap. WeChat's animation engine is more mature. Douyin at the time exhibited quirks with CSS transitions and `requestAnimationFrame` behavior. We ultimately rewrote animations using canvas operations with manual frame management.
- Package size limits and subpackage loading strategies differed between platforms, requiring adjustments to our code splitting approach.
- Douyin's review process was stricter regarding certain APIs — location and user data in particular — requiring additional permission handling.

### AI-Assisted Development

**Q: How did you design the Agent Skills at REA Group? What defines a good skill?**
- A good skill encodes a repeatable workflow with clear inputs, outputs, and constraints. It is a process definition, not merely a prompt template.
- Example — the testing skill: input is a component or function file; output is a test file with meaningful cases. The skill prompt incorporates project-specific conventions (Jest + React Testing Library, naming patterns, mock strategies) alongside explicit anti-patterns to avoid — such as testing implementation details or duplicating component logic in tests.
- The skill must be opinionated and narrowly scoped. A vague instruction like "write good code" produces unreliable output. A specific instruction — "given this React component, write tests covering the happy path, error states, and edge cases, following this file structure" — produces consistent results.
- We refined them iteratively: track where output quality drops, adjust the prompt, repeat. After two to three iterations per skill, they became quite reliable.

**Q: Where do you see AI-assisted development heading? What are the current limits?**
- Strengths: generating tests, boilerplate, documentation, straightforward refactoring, and identifying common patterns in code review.
- Weaknesses: novel architectural decisions, debugging issues that span multiple services with deep context, and interpreting implicit business requirements that were never formally documented.
- The risk I consider most significant: skill atrophy. If a developer habitually asks AI to fix errors, they stop constructing the mental model of how the system actually works. I read every line of AI-generated code before committing — not out of distrust for the tool, but because I need to understand what we are shipping.

---

## 4. Project Walkthroughs (3-Minute Narratives)

### Porsche Dealer System

> This was a four-year engagement building Porsche's dealer management platform for the Chinese market. The system supported Porsche's entire dealership network — hundreds of dealers across China — with a team of over 100 engineers.
>
> As frontend lead, I was responsible for four surfaces: WeChat Mini Program for dealers in the field, Douyin Mini Program as a secondary channel, H5 for quick mobile access, and a Web Admin portal for back-office operations.
>
> The cross-platform strategy was the most technically interesting aspect. We adopted TaroJS early to compile a single React codebase to multiple targets. In practice, it was never entirely seamless — each platform introduced its own behavior. I built a shared component library as a Lerna monorepo containing 15+ business components that absorbed platform differences internally. A vehicle card renders consistently across WeChat, Douyin, and H5, while the component handles the platform-specific details behind the scenes.
>
> The Douyin migration was the major milestone. The business needed to reach dealers on Douyin, but Taro's Douyin support was less mature at the time. We encountered API incompatibilities and significant animation performance degradation. I led the animation rewrite personally, moving from CSS-based animations to a canvas-based approach with manual frame control. The outcome was roughly 70% code reuse, meaning we avoided maintaining two separate codebases.
>
> On the process side, I introduced practices that were not yet standard on the team: strict ESLint rules, mandatory code review, and TDD for critical business logic. These were met with some resistance initially, but within a few months the reduction in regression bugs made the value clear.

### REA Group

> REA Group operates realestate.com.au and realcommercial.com.au — the dominant property platforms in Australia, comparable to Zillow in the US market. Millions of monthly users, with high expectations around reliability.
>
> I joined a team responsible for maintaining and extending both platforms. The stack was React, TypeScript, and Next.js on the frontend, with a Node.js/Express BFF layer that I also contributed to. This was my first experience on a genuinely international team — my daily standups included engineers in Melbourne and India.
>
> Two aspects of that experience stand out. First, the engineering rigor. Every commit passed through CI — linting, type checking, unit tests, integration tests — before it could even be reviewed. Coming from a lead role at Porsche where I had advocated for these practices, it was satisfying to work in an environment where they were the established baseline.
>
> Second, this is where AI-assisted development began to make sense for me at scale. I started with Claude Code for my own workflow, but recognized that the greater value was in making it repeatable across the team. I built a set of Agent Skills — parameterized prompts incorporating project-specific knowledge. The testing skill, for instance, understood our Jest configuration, mock patterns, and file structure conventions. A team member could point it at a new component and receive a solid first draft of tests within seconds.
>
> The central lesson I took away: AI tools amplify existing engineering practices. They do not substitute for them. In a well-structured, consistent codebase, AI produces strong output. In a disorganized one, it simply produces more noise, faster.

### IoT Rural Restroom Management System

> This was my first role after university, and I was the sole frontend developer — which meant I owned architecture, development, and deployment. The system placed IoT sensors in public restrooms across rural China, tracking occupancy in real time. Government workers used the platform to identify facilities needing attention and follow optimized cleaning routes.
>
> I built two applications: a WeChat Mini Program for field workers and a React web admin for the operations center. The mini program was the more complex of the two — it displayed real-time restroom status from IoT data streams, rendered dynamically planned routes on a map, and tracked GPS-equipped vehicles.
>
> Being the only frontend developer that early in my career taught me a number of lessons the hard way. I made architectural decisions without a senior engineer to validate them. I debugged production issues late at night. I explained technical tradeoffs to non-technical stakeholders who simply needed the system to work. It also gave me a clear understanding of why practices like code review and automated testing matter. Part of the reason I later championed those practices at Thoughtworks was having experienced the consequences of working without them.

---

## 5. Questions to Ask the Interviewer

1. **On engineering culture:** "What does the code review process look like on your team? How do you balance thoroughness with shipping on schedule?"
2. **On tech stack:** "What are the most challenging technical problems the team is working through at the moment?"
3. **On cross-functional collaboration:** "How do frontend, backend, and design collaborate? Is it a handoff model, or are people embedded on cross-functional teams?"
4. **On career growth:** "If I were to join, what would you hope I'd have accomplished in the first six months?"
5. **On AI tools:** "Is the team using or exploring AI-assisted development tools? I would be interested in contributing if there is openness to it."
6. **On team structure:** "How distributed is the team? I have experience working across time zones and would be curious how you approach asynchronous communication."
7. **On tech debt:** "How does the team balance feature development with technical improvements or debt reduction?"
8. **On the role:** "What was the most valuable contribution of the previous person in this role, and what would you want to see done differently?"

---

## 6. Common Pitfalls & How to Address Them

| Potential Concern | How to Address |
|---|---|
| **"You left Thoughtworks with no next job lined up."** | "After nearly five years, I wanted to be deliberate about my next move rather than rushing into the first opportunity. I have been using this time to deepen my skills and reflect on the kind of team and work I want next." |
| **"Your early role (Feifeng) was IoT, not traditional web development."** | "That role taught me to deliver independently — architecture, development, deployment, all of it. It also gave me experience with IoT data and real-time systems that most frontend engineers never encounter." |
| **"There is a gap between graduation (Jun 2019) and your first development role (Oct 2019)."** | "I had a brief stint at an electronics company after graduation. It was a talent program rather than a hands-on development role, and I realized quickly that I wanted to build software rather than work in manufacturing. I transitioned to a tech company within three months." |
| **"Your experience appears to be primarily with Chinese companies or China-market products."** | "At Thoughtworks, I worked daily in English with teams in Australia and India on REA Group's platforms — those are Australian-market products serving millions of users. The cross-cultural collaboration was a core part of the work, not a footnote." |
| **"Seven years of experience, but none at a well-known tech company."** | "I prioritized working on complex products with real user impact over brand recognition. Porsche's dealer network spans the entire Chinese market. REA Group dominates Australian real estate. These are serious production systems. Thoughtworks, while not a FAANG company, is known for genuine engineering rigor and a selective hiring process." |

---

*Generated from `notes/resume/resume.md`. Review and personalize before using in interviews.*
