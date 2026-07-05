# English Interview Preparation — Linfeng Pan

---

## 1. Self-Introduction (1–2 Minute Elevator Pitch)

> Hi, I'm Linfeng Pan. I've been a frontend engineer for about seven years, mostly working with React, Next.js, and TypeScript. I spent the bulk of that time at Thoughtworks, where I worked with global clients — mainly Porsche and REA Group.
>
> At Porsche, I was the frontend lead for their dealer management system. It ran across four platforms: WeChat Mini Program, Douyin Mini Program, H5, and Web Admin. One thing I'm pretty proud of from that project: we migrated from WeChat to Douyin Mini Program and managed to reuse about 70% of the code, even though the APIs on the two platforms didn't always play nice with each other.
>
> After that I moved to REA Group, which runs Australia's biggest real estate platforms — realestate.com.au and realcommercial.com.au. I worked on the Next.js frontend and the Node.js BFF layer, with daily standups alongside engineers in Melbourne and India. That's also where I started taking AI-assisted development seriously. I built a set of custom Agent Skills on Claude Code that covered our whole workflow, from breaking down requirements through code review and CI/CD.
>
> I'm looking for a role where I can keep working with modern frontend tech, ideally in an English-speaking environment where technical depth and cross-cultural collaboration both matter.

---

## 2. Behavioral Questions — STAR-Format Talking Points

### Q: Tell me about a challenging project.

**Map to:** Porsche WeChat → Douyin Mini Program Migration

- **Situation:** Porsche's dealer system was a WeChat Mini Program built with TaroJS. The business wanted to expand to Douyin (TikTok China) to reach more dealers.
- **Task:** Move the existing mini program to Douyin without rewriting everything. We didn't have the time for a full rewrite.
- **Action:** I started by going through Taro's API compatibility between the two platforms. Several core APIs either worked differently or just weren't supported on Douyin. The animation system was the worst offender — it ran fine on WeChat but fell apart on Douyin. I worked through each incompatible API one at a time, then rewrote the animation layer using lower-level primitives and built a shared abstraction both platforms could use.
- **Result:** We hit about 70% code reuse. Just as important, we documented every compatibility issue we ran into and how we fixed it. That became the team's go-to reference for all the cross-platform migrations that followed.

### Q: Tell me about a time you led a technical initiative.

**Map to:** Cross-platform component library or AI engineering pipeline

- **Situation:** At Porsche, four separate platforms — WeChat, Douyin, H5, Web Admin — each had teams independently building the same kinds of UI components: vehicle cards, dealer selectors, form components. The result was inconsistent UX and a lot of duplicated effort.
- **Task:** Build one component library that could serve all four platforms.
- **Action:** I set up a Lerna + Yarn Workspace monorepo, designed component APIs that worked with Taro's multi-platform compilation, and led the team through building and documenting 15+ business components. Each component had to handle platform-specific behavior internally while exposing a consistent interface.
- **Result:** The library killed redundant UI work across teams. Components got built once and were available everywhere. New features shipped on all four platforms at the same time.

### Q: How do you handle disagreements in code review?

**Map to:** Thoughtworks engineering culture

- **Situation:** Thoughtworks has a strong code review culture. I reviewed other people's code and had mine reviewed daily, sometimes by engineers in Australia and India who saw things differently than I did.
- **Action:** I separate style preferences from real concerns. For style stuff, I point at the ESLint config — if the linter doesn't care, it's probably not worth arguing about. For actual technical issues, I ask the reviewer to walk me through the scenario they're worried about. A lot of times they caught edge cases I hadn't thought of. When I do think my approach is right, I explain my reasoning with concrete examples instead of just saying "I prefer it this way."
- **Result:** Treating review as a conversation rather than a defense makes a real difference. At Porsche, I made it part of our process: every review comment had to include either a specific suggestion or a clarifying question. Vague feedback pretty much disappeared.

### Q: Describe a time you solved a production issue.

**Map to:** REA Group incident response

- **Situation:** At REA Group, a deploy broke a critical page on realcommercial.com.au. Real users browsing commercial property listings were seeing errors.
- **Task:** Figure out what happened and fix it fast.
- **Action:** I traced the error through our monitoring dashboards, found the bad component, and tracked down the root cause: a data structure had changed in the BFF API and the frontend wasn't handling it — basically a null safety issue. I rolled back the change first to get the site working again, then coordinated with the backend team to align the API contract, added proper null handling on the frontend, and wrote a regression test.
- **Result:** Service was back up within 30 minutes. The regression test went into the CI pipeline, so the same class of error would get caught before deploy next time.

### Q: How do you learn new technology?

**Map to:** AI-assisted development journey

- **Situation:** When AI coding tools started getting useful around 2023-2024, I wanted to go beyond using them as fancy autocomplete. I wanted to figure out how to actually integrate them into real development workflows.
- **Action:** I started experimenting with Claude Code on my daily tasks, paying attention to where it helped and where it didn't. It was strong at generating test cases and boilerplate, but needed tight constraints for business logic. Over time I built custom Agent Skills that encoded these patterns: one for breaking down requirements into workable pieces, one for generating tests, one for code review. Each had specific prompts and guardrails I figured out through trial and error.
- **Result:** What started as a personal experiment eventually got adopted by the broader team. The testing skill especially moved the needle on test coverage, mostly by cutting down the friction of writing tests from scratch.

### Q: Tell me about a time you had to collaborate across cultures or time zones.

**Map to:** REA Group Australia-India-China collaboration

- **Situation:** At REA Group, our team was spread across three countries: Australia (Melbourne), India, and me in China. That meant real time zone gaps and different communication norms.
- **Action:** I shifted my schedule so my afternoons overlapped with Melbourne mornings for standups and pairing sessions. For async communication, I learned to be way more explicit in writing. Chinese work culture sometimes leans on implicit understanding, which doesn't really work on international teams. I started writing detailed PR descriptions and recording screen demos of my changes. I also made a point of joining informal team stuff — group chats, virtual coffee breaks — which helped build rapport across the distance.
- **Result:** We kept a steady delivery cadence despite the time differences. My tech lead in Australia specifically called out my communication as a strength in performance reviews. It wasn't just about English ability — it was about adapting how I communicate to fit the context.

---

## 3. Technical Deep-Dive Questions

### React

**Q: Explain how React Fiber works and why it matters.**
- Fiber is React's reconciliation engine, added in React 16. The big idea: rendering work gets split into small units that can be paused and resumed.
- Before Fiber, reconciliation was synchronous — once a render started, it blocked the main thread until it finished.
- Fiber uses a linked list under the hood (each node has `child`, `sibling`, `return` pointers), so React can walk the component tree incrementally.
- Updates get assigned priorities — user input gets high priority, data fetch responses get lower. React can yield to the browser between units to stay responsive.
- The practical payoff: features like `Suspense`, `useTransition`, and concurrent rendering are all built on top of Fiber.

**Q: Walk me through the useEffect cleanup function.**
- The cleanup function runs in two cases: before the effect re-runs (because dependencies changed), and when the component unmounts.
- Common uses: clearing timers and intervals, canceling subscriptions, aborting in-flight fetch requests, removing event listeners.
- One thing worth knowing: in React 18 Strict Mode (development only), effects mount, unmount, then remount to catch missing cleanups. If your app breaks in Strict Mode, a missing cleanup is usually why.
- The cleanup function captures the previous render's closure. If you're not careful, you can end up cleaning up with stale data. Refs help when you need the latest value inside a cleanup.

**Q: How would you optimize a React app with rendering performance issues?**
- Start by measuring. React DevTools Profiler tells you which components are re-rendering and why.
- `React.memo` for pure components that re-render on parent updates even though their props haven't changed.
- `useMemo` and `useCallback` for expensive computations and stable function references — but use them selectively, they come with their own cost.
- Move state downward. A state change shouldn't cause huge subtrees that don't depend on it to re-render.
- `useTransition` for non-urgent updates, so the UI doesn't freeze on expensive renders.
- Virtualization (react-window or react-virtuoso) for long lists.
- Code splitting with `React.lazy` + `Suspense` to keep the initial bundle smaller.

### Cross-Platform Development

**Q: How does TaroJS compile to multiple platforms?**
- Taro takes a compile-time approach: you write in React or Vue syntax, and Taro's compiler transforms the code into platform-specific output.
- For mini programs, React components get mapped to mini-program templates (WXML for WeChat), and the React event system gets mapped to mini-program events.
- The runtime includes a lightweight React-like reconciler that runs inside the mini program's JavaScript engine.
- The big limitation: mini program environments don't have standard browser or DOM APIs. Taro provides polyfills and abstractions, but edge cases are unavoidable — which is exactly what we ran into during the Douyin migration.

**Q: What were the main differences between WeChat and Douyin mini programs in practice?**
- API namespace differences: same functionality, different signatures or module names. Taro abstracts most of this, but some platform-specific APIs still leak through.
- Animation performance was the biggest gap. WeChat's animation engine is more mature. At the time, Douyin had quirks with CSS transitions and `requestAnimationFrame` behavior. We ended up rewriting animations using canvas operations with manual frame management.
- Package size limits and subpackage loading strategies differed between platforms, so we had to adjust our code splitting approach.
- Douyin's review process was stricter on certain APIs — location and user data especially — which meant extra permission handling.

### AI-Assisted Development

**Q: How did you design the Agent Skills at REA Group? What makes a good skill?**
- A good skill encodes a repeatable workflow with clear inputs, outputs, and constraints. It's a process definition, not just a prompt template.
- Example: the testing skill. Input: a component or function file. Output: a test file with meaningful cases. The skill prompt includes project-specific conventions (Jest + React Testing Library, naming patterns, mock strategies) plus explicit anti-patterns to avoid — like testing implementation details or duplicating component logic in tests.
- The skill needs to be opinionated and narrowly scoped. A vague instruction like "write good code" gives unreliable output. Something specific — "given this React component, write tests covering the happy path, error states, and edge cases, following this file structure" — produces consistent results.
- We refined them iteratively: track where output quality drops, tweak the prompt, repeat. After two or three rounds per skill, they got pretty reliable.

**Q: Where do you see AI-assisted development heading? What are the current limits?**
- Strengths: generating tests, boilerplate, documentation, straightforward refactoring, and spotting common patterns in code review.
- Weaknesses: novel architectural decisions, debugging issues that span multiple services with deep context, and understanding implicit business requirements that were never written down.
- The risk I worry about most: skill atrophy. If you habitually ask AI to fix errors, you stop building the mental model of how the system actually works. I read every line of AI-generated code before committing — not because I don't trust the tool, but because I need to understand what we're shipping.

---

## 4. Project Walkthroughs (3-Minute Narratives)

### Porsche Dealer System

> This was a four-year engagement building Porsche's dealer management platform for the Chinese market. The system supported Porsche's entire dealership network — hundreds of dealers across China — with a team of over 100 engineers.
>
> As frontend lead, I was responsible for four surfaces: WeChat Mini Program for dealers in the field, Douyin Mini Program as a secondary channel, H5 for quick mobile access, and a Web Admin portal for back-office stuff.
>
> The cross-platform strategy was the most interesting part technically. We adopted TaroJS early to compile a single React codebase to multiple targets. In practice, it was never totally seamless — each platform had its own quirks. I built a shared component library as a Lerna monorepo with 15+ business components that absorbed platform differences internally. A vehicle card renders the same way across WeChat, Douyin, and H5, while the component handles the platform-specific details under the hood.
>
> The Douyin migration was the major milestone. We needed to reach dealers on Douyin, but Taro's Douyin support was less mature at the time. We hit API incompatibilities and serious animation performance problems. I led the animation rewrite myself, moving from CSS-based animations to a canvas-based approach with manual frame control. The outcome was about 70% code reuse, which meant we avoided maintaining two separate codebases.
>
> On the process side, I introduced practices that weren't standard on the team yet: strict ESLint rules, mandatory code review, and TDD for critical business logic. There was some pushback at first, but within a few months the drop in regression bugs made the value pretty obvious.

### REA Group

> REA Group runs realestate.com.au and realcommercial.com.au — the dominant property platforms in Australia, kind of like Zillow in the US. Millions of monthly users, high expectations around reliability.
>
> I joined a team responsible for maintaining and extending both platforms. The stack was React, TypeScript, and Next.js on the frontend, with a Node.js/Express BFF layer that I also contributed to. This was my first time on a genuinely international team — my daily standups included engineers in Melbourne and India.
>
> Two things from that experience stand out. First, the engineering rigor. Every commit went through CI — linting, type checking, unit tests, integration tests — before anyone could even review it. Coming from a lead role at Porsche where I'd been pushing for these practices, it was nice to work somewhere they were already baseline.
>
> Second, this is where AI-assisted development started making sense for me at scale. I started with Claude Code for my own workflow, but it clicked that the bigger value was making it repeatable across the team. I built a set of Agent Skills — parameterized prompts with project-specific knowledge baked in. The testing skill, for example, understood our Jest config, mock patterns, and file structure conventions. Someone could point it at a new component and get a solid first draft of tests in seconds.
>
> The main thing I took away: AI tools amplify existing engineering practices. They don't replace them. In a well-structured, consistent codebase, AI produces strong output. In a messy one, it just produces more noise, faster.

### IoT Rural Restroom Management System

> This was my first job out of university, and I was the only frontend developer — which meant I owned architecture, development, and deployment. The system put IoT sensors in public restrooms across rural China, tracking occupancy in real time. Government workers used it to spot facilities that needed attention and follow optimized cleaning routes.
>
> I built two applications: a WeChat Mini Program for field workers and a React web admin for the operations center. The mini program was the trickier of the two — it showed real-time restroom status from IoT data streams, rendered dynamically planned routes on a map, and tracked GPS-equipped vehicles.
>
> Being the only frontend dev that early in my career taught me a bunch of lessons the hard way. I made architectural decisions without a senior engineer to validate them. I debugged production issues late at night. I explained technical tradeoffs to non-technical stakeholders who just needed the system to work. It also gave me a clear sense of why practices like code review and automated testing matter. Part of the reason I later pushed for those practices at Thoughtworks was having experienced what it's like working without them.

---

## 5. Questions to Ask the Interviewer

1. **On engineering culture:** "What does code review look like on your team? How do you balance being thorough with shipping on time?"
2. **On tech stack:** "What are the hardest technical problems the team is working through right now?"
3. **On cross-functional collaboration:** "How do frontend, backend, and design work together? Is it a handoff thing, or are people embedded on the same team?"
4. **On career growth:** "If I joined, what would you want me to have gotten done in the first six months?"
5. **On AI tools:** "Is the team using or exploring AI-assisted dev tools? I'd be interested in contributing if there's openness to it."
6. **On team structure:** "How distributed is the team? I've worked across time zones and I'm curious how you handle async communication."
7. **On tech debt:** "How do you balance feature work with fixing tech debt or making improvements?"
8. **On the role:** "What was the most valuable thing the last person in this role did, and what would you want to see done differently?"

---

## 6. Common Pitfalls & How to Address Them

| Potential Concern | How to Address |
|---|---|
| **"You left Thoughtworks with no next job lined up."** | "After almost five years, I wanted to be deliberate about my next move instead of jumping at the first thing. I've been using the time to deepen my skills and think about what kind of team and work I actually want." |
| **"Your early role (Feifeng) was IoT, not traditional web dev."** | "That role taught me to ship things on my own — architecture, development, deployment, all of it. It also gave me experience with IoT data and real-time systems that most frontend engineers never touch." |
| **"There's a gap between graduation (Jun 2019) and your first dev role (Oct 2019)."** | "I had a short stint at an electronics company after graduating. It was more of a talent program than hands-on development, and I figured out pretty fast that I wanted to build software, not work in manufacturing. I switched to a tech company within three months." |
| **"Your experience looks like it's mostly Chinese companies or China-market products."** | "At Thoughtworks, I worked daily in English with teams in Australia and India on REA Group's platforms — those are Australian-market products with millions of users. The cross-cultural part was core to the work, not a side note." |
| **"Seven years of experience, but none at a big-name tech company."** | "I prioritized working on complex products with real user impact over brand recognition. Porsche's dealer network covers the entire Chinese market. REA Group dominates Australian real estate. These are serious production systems. Thoughtworks, while it's not FAANG, is known for real engineering rigor and a selective hiring process." |

---

*Generated from `notes/resume/resume.md`. Review and personalize before using in interviews.*
