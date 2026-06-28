# English Interview Preparation: Linfeng Pan

> Based on [resume-en.md](../resume/resume-en.md). Practice aloud. If it doesn't sound natural spoken, rephrase.

---

## 1. Self-Introduction (Elevator Pitch, 90 seconds)

"Hi, I'm Linfeng, a frontend engineer with about seven years of experience building production systems across web and mini program platforms.

I spent the last five years at Thoughtworks, where I worked on two major engagements. The first was Porsche's dealer network system in China. I was the frontend lead across four platforms: WeChat Mini Program, Douyin Mini Program, Web, and H5. The interesting part was leading the migration from WeChat to Douyin, where we managed about 70% code reuse despite some real API compatibility headaches.

The second was REA Group, which is Australia's largest property platform. I worked full-stack there with a distributed team across Australia and India. That's also where I got deep into AI-assisted development. I built a set of custom Agent Skills on top of Claude Code that automated chunks of our delivery pipeline: everything from spec breakdown to automated testing to pre-commit review. It wasn't just about writing code faster. It changed how the team thought about quality gates.

Before Thoughtworks, I was the solo frontend dev at a smaller company building an IoT sanitation management system, which taught me a lot about owning things end to end.

I'm looking for a role where I can bring both the cross-platform experience and the AI engineering practices I've developed. I'm available to start right away."

**What this intro does:**
- Leads with experience level and domain
- Names the two most impressive engagements (Porsche, REA Group)
- Gives specific, concrete details (70% reuse, four platforms, Agent Skills)
- Mentions the smaller-company experience (shows versatility)
- Ends with what you're looking for

---

## 2. Behavioral Questions: STAR-Format Talking Points

### Q: "Tell me about a challenging technical project."

**Map to:** Porsche WeChat to Douyin Mini Program Migration

**Situation:** Porsche's dealer network system was built on WeChat Mini Program using TaroJS. The business wanted to expand to Douyin's ecosystem to reach a different user base. We had a large codebase and couldn't afford a full rewrite.

**Task:** Migrate the WeChat Mini Program to Douyin Mini Program while maximizing code reuse and keeping the existing feature set.

**Action:**
- Started by auditing the Taro API surface to find which APIs had compatibility issues on Douyin's runtime
- The biggest problem areas were animations (Douyin's runtime handled CSS animations and requestAnimationFrame differently) and certain Taro native APIs that behaved inconsistently
- Rewrote the animation module using Douyin-compatible approaches while keeping the component layer mostly intact
- Set up a shared code structure where platform-specific code was isolated behind a common interface

**Result:** Hit ~70% code reuse. The approach became the template for later cross-platform migrations. The Douyin version launched on schedule.

**Practice points:** Be ready to explain *which specific APIs* broke and *how* you resolved them. The interviewer may drill into Taro internals.

---

### Q: "Tell me about a time you led a technical initiative."

**Map to:** Cross-platform component library (Porsche)

**Situation:** Four platforms (WeChat, Douyin, Web Admin, H5) were each building their own UI components. Vehicle cards, dealer selectors, form components: same design specs, four implementations. Duplication was slowing everything down.

**Task:** Build a shared component library that worked across all four platforms, within a Monorepo structure that teams could contribute to without conflicts.

**Action:**
- Chose Taro + Lerna/Yarn Workspaces for the Monorepo setup. Taro because it already supported multi-platform compilation, Lerna for package versioning
- Defined the component API contract first: what props each component would accept across platforms
- Built 15+ components incrementally, starting with the highest-duplication ones (vehicle cards, dealer selector)
- Set up linting rules and review process for contributions from other teams
- Each component had platform-specific adapters where needed, but a single source of truth for business logic

**Result:** Eliminated duplicate UI development across four platforms. New features that used these components shipped faster because the UI layer was already done.

**Practice points:** Be ready to compare this to alternatives (Taro UI, Vant Weapp) and explain why building your own made sense for Porsche's specific design system.

---

### Q: "How do you handle disagreements in code review?"

**Map to:** Thoughtworks engineering culture

**Situation:** At Thoughtworks, code review was mandatory. With distributed teams across China, Australia, and India, disagreements came up regularly: different coding styles, different levels of TypeScript strictness, different opinions on abstraction vs. duplication.

**Framework for answering:**
1. **Start with the standard.** If we have an ESLint rule or team convention, that settles it. No debate needed.
2. **If it's a matter of opinion,** ask "what problem are you trying to solve with this change?" Often the disagreement disappears once you align on the actual problem.
3. **If it's a genuine design disagreement,** write up both approaches with tradeoffs and bring it to the team channel. Don't let it sit in PR comments for three days.
4. **Never block on style.** If it works, passes tests, and is readable enough, approve with suggestions rather than blocking.

**Example to share:** "I remember a PR where someone wanted to abstract a shared utility, and I thought it was premature. The two use cases weren't actually the same, they just looked similar. We ended up keeping them separate, and three sprints later the requirements diverged further. I was glad we didn't couple them early."

---

### Q: "Describe a time you solved a production issue."

**Map to:** REA Group incident response

**Situation:** Production issue on a high-traffic property listing page. Something was causing page load failures for a subset of users.

**Task:** Identify root cause and deploy a fix without affecting the rest of the platform.

**Action:**
- First: checked monitoring dashboards and logs to narrow the scope. Was it a specific region? Specific property type? Specific browser?
- Once narrowed down, reproduced locally using the same data conditions
- Identified the bug, wrote a failing test that reproduced it, fixed it, confirmed the test passed
- Deployed with a feature flag so we could roll back instantly if needed
- After the fix, wrote up a root cause analysis and added monitoring for that specific failure mode

**Result:** Issue resolved within a few hours. The post-mortem led to adding a new health check for that class of error.

**Alternative scenario (if asked for more detail):** "Not all incidents are code bugs. I've also dealt with third-party API changes that broke our integration, and caching issues where stale data was being served. For each one, the pattern is the same: narrow the scope, reproduce, fix with a test, deploy safely, and prevent recurrence."

---

### Q: "How do you learn new technology?"

**Map to:** AI-assisted development journey

**Framework for answering:**

"Two things changed how I learn. First, I learn by building. I need a real problem, not a tutorial. Second, I now use AI as a learning accelerator, but in a specific way.

When I started at Thoughtworks, I needed to learn TaroJS for the Porsche project. Instead of reading docs cover to cover, I picked a small real feature and built it. When I hit something I didn't understand, I'd read the relevant docs or source code. The context of a real problem makes the knowledge stick.

More recently, with AI tools, my approach has evolved. I use Claude Code to explore codebases I'm unfamiliar with: 'explain this module's architecture' or 'what's the data flow here.' I use it to generate test cases that force me to think about edge cases. But I'm deliberate about not letting it do the thinking for me. If the AI writes a solution I don't fully understand, I'll ask it to explain the reasoning, then I'll rewrite it myself.

The key insight: AI is best as a thinking partner, not a replacement. It's great at accelerating the 'what' and 'how,' but I still need to own the 'why.'"

---

### Additional Behavioral Questions to Practice

| Question | Map To | Key Point to Hit |
|---|---|---|
| "Tell me about a time you failed." | Any project setback | Show what you learned, not just what went wrong |
| "How do you prioritize when everything is urgent?" | Porsche (four platforms, many stakeholders) | Framework for assessing business impact vs. effort |
| "Describe working with a difficult stakeholder." | Any client engagement | Focus on communication strategies, not the person |
| "Why did you leave Thoughtworks?" | Career move | Frame positively: what you're moving toward, not away from |
| "Where do you see yourself in 3-5 years?" | Career goals | Staff engineer / tech lead who bridges AI tooling and frontend architecture |

---

## 3. Technical Deep-Dive Questions

### React

**Q: "Walk me through React Fiber's architecture and why it matters."**

Topics to cover:
- Fiber's core problem: synchronous rendering blocks the main thread. Long component trees cause dropped frames.
- Solution: Fiber makes rendering interruptible by representing the component tree as a linked list of "fiber nodes" that can be paused and resumed
- Key concepts: `requestIdleCallback` (or Scheduler's polyfill), priority levels, reconciliation phases (render vs. commit)
- Why it matters for your work: when building animation-heavy mini programs at Porsche, understanding scheduling helped you avoid jank
- Practical takeaway: `useTransition` and `useDeferredValue` are the hooks-level APIs that leverage Fiber's scheduling

**Q: "Explain React Hooks internals. How does `useState` actually work?"**

Topics to cover:
- Hooks rely on call order. React maintains a linked list of hook states per fiber. This is why hooks can't be conditional.
- `useState` stores state in a queue; `useEffect` stores effects in a separate list flushed after commit
- Closure traps: stale state in event handlers, why `useRef` + `.current` stays fresh
- Performance: `useMemo`/`useCallback`: when they actually help vs. when they're premature optimization

**Q: "How do you approach performance optimization in a React app?"**

Structure your answer:
1. **Measure first.** React DevTools Profiler, Lighthouse, Web Vitals. Never optimize without data.
2. **Common culprits:** unnecessary re-renders, large bundle sizes, expensive computations in render, unoptimized images
3. **Tools:** `React.memo`, `useMemo`, `useCallback`, code splitting (`React.lazy` + `Suspense`), virtual scrolling, image lazy loading
4. **Real example from your work:** At REA Group, property listing pages with hundreds of cards. You'd talk about virtual scrolling, image optimization, and avoiding re-renders when filter state changes

### Cross-Platform (TaroJS & Mini Programs)

**Q: "Explain Taro's architecture. How does it compile to different platforms?"**

Topics to cover:
- Taro's approach: write React/Vue code, compile to mini program templates (WXML, TTML, etc.) and their respective runtime APIs
- The compilation pipeline: JSX to mini program template, with logic layer separation
- Runtime adapter pattern: Taro abstracts platform APIs behind a unified interface; each platform has its own adapter
- Pain points you've encountered: animation performance differences, CSS support gaps, API behavior inconsistencies between WeChat and Douyin

**Q: "What are the key differences between WeChat Mini Program and Douyin Mini Program from a developer's perspective?"**

Based on your direct experience:
- Runtime behavior: Douyin's JavaScript runtime handles timers and animations differently
- API coverage: not all WeChat APIs have Douyin equivalents; some behave subtly differently
- CSS support: different levels of CSS property support, especially around animations and transforms
- Development tools: different debugging experiences; Douyin's devtools have improved but still lag WeChat's in some areas
- Ecosystem: WeChat has a larger component ecosystem (WeUI, Vant Weapp); Douyin is catching up

### Engineering & AI-Assisted Development

**Q: "How did you design the Agent Skills at REA Group?"**

1. **The problem:** We had a consistent development workflow but each developer executed it differently. Code review found the same issues repeatedly. Test coverage was inconsistent.
2. **The approach:** Instead of writing a monolithic script, I broke the workflow into discrete skills that could be composed:
   - Spec Skill: takes a requirement, outputs structured spec with acceptance criteria
   - Unit Test Skill: reads the implementation, generates Jest tests covering happy path and edge cases
   - Code Review Skill: runs on the diff, checks against our ESLint rules and team conventions, flags issues before human review
   - Issue Skill: when a bug is found, generates a structured report with reproduction steps, root cause, and fix proposal
3. **The impact:** PRs came in cleaner. Review time dropped because mechanical issues were caught automatically. Tests were more consistent because the skill enforced the same patterns.
4. **Lessons learned:** AI-generated code still needs human judgment. The skills work best as first-pass tools. They handle the mechanical work so humans can focus on design and edge cases.

**Q: "What do you think about the current state of AI in software development?"**

- AI is genuinely useful for mechanical tasks: boilerplate, test generation, documentation, code review pre-checks
- The gap: AI still struggles with system design decisions, tradeoff analysis, and understanding business context
- The risk: over-reliance. Developers who let AI do the thinking will plateau. The skill is shifting from "writing code" to "specifying intent and verifying output"
- Your personal philosophy: use AI to accelerate engineering judgment, not replace it

---

## 4. Project Walkthroughs (3-Minute Narratives Each)

### Walkthrough 1: Porsche Dealer Network System

**Context (30 sec):** "Porsche needed a digital system for their dealer network across China. We're talking hundreds of dealerships. Salespeople, managers, service staff: all needed tools to manage inventory, recommend vehicles, and track sales. The system had to work across four platforms because different users had different devices and contexts."

**Your role (30 sec):** "I was the frontend lead. That meant I was responsible for the architecture decisions, the component library strategy, and the quality baseline across all four platforms. I also led the WeChat-to-Douyin migration, which turned out to be one of the harder engineering problems on the project."

**Key technical decisions (60 sec):**
- "We chose TaroJS because it promised write-once, run-on-multiple-mini-programs. In practice, it got us about 80% of the way. The last 20% was platform-specific work."
- "The Monorepo and component library decision was critical. With a 100-person team, if every sub-team was building their own UI, we'd have chaos. The component library enforced consistency and saved enormous time."
- "For the Douyin migration, the biggest decision was whether to fork the codebase or share code. We chose shared code with platform adapters, which was harder to set up but paid off every time we added a feature afterward."

**Results (30 sec):** "Four platforms, one codebase with ~70% reuse. The system is in production across Porsche's entire China dealer network. And the migration pattern we established has been reused by other teams."

**If they ask what you'd do differently:** "I'd invest more in automated cross-platform testing up front. We caught some Douyin-specific issues late in QA that could have been caught earlier with better platform-specific test coverage."

---

### Walkthrough 2: REA Group AI-Assisted Development Pipeline

**Context (30 sec):** "REA Group runs realestate.com.au and realcommercial.com.au. They're the dominant property platforms in Australia, with millions of users. I was on a distributed team with developers in Australia and India, working full-stack on the platform."

**Your role (30 sec):** "I was a full-stack engineer: React/Next.js on the frontend, Node.js/Express on the backend. But what made this role different was that I took the initiative to build out the AI-assisted development workflow. It wasn't something assigned to me. I saw the opportunity and built it."

**Key technical decisions (60 sec):**
- "I used Claude Code as the base platform because it had an Agent Skill system I could extend. The insight was that our development workflow was predictable enough to automate parts of it without losing quality."
- "Each Skill was designed to do one thing well. The Spec Skill doesn't write code: it structures requirements. The Unit Test Skill doesn't decide what to test: it reads the implementation and generates coverage for the patterns it finds."
- "The pipeline wasn't meant to replace human review. It was meant to handle the mechanical checks so human reviewers could focus on design, security, and business logic."

**Results (30 sec):** "The pipeline cut PR review cycles noticeably. Tests were more consistent. And this was the unexpected benefit: it made onboarding faster because new team members could see the standards enforced by the skills."

---

### Walkthrough 3: Rural Sanitation IoT System

**Context (30 sec):** "Before Thoughtworks, I worked at a smaller company building IoT systems. This project put sensors in rural public restrooms to monitor stall occupancy, and provided a mini program for government workers to find and clean facilities efficiently."

**Your role (30 sec):** "I was the only frontend developer, which meant I handled everything: requirements, architecture, implementation, deployment. For a junior-to-mid-level engineer, that's a lot of ownership."

**Key technical decisions (45 sec):**
- "The mini program was the right choice for this audience: government workers in rural areas, mostly on WeChat, no app install required."
- "The dynamic route planning was the hardest part. I implemented a relatively simple algorithm that could run on-device in the mini program's limited runtime, rather than calling a server API and waiting."
- "GPS tracking in a mini program had accuracy limitations, but for this use case (knowing which street a vehicle was on) it was sufficient."

**Results (15 sec):** "The system went live and was used by local government staff. More importantly, it taught me how to own a product end to end, which shaped how I approach engineering today."

---

## 5. Questions to Ask the Interviewer

Pick 3-4 that genuinely interest you. Don't ask all of them.

**About the team and work:**
1. "What does the frontend architecture look like today, and what's the biggest pain point the team is trying to solve?"
2. "How does the team handle cross-platform or multi-app development, if that's relevant here?"
3. "What's the balance between building new features and improving existing ones?"

**About engineering culture:**
4. "What does code review look like on your team? Is it a blocker or a collaboration tool?"
5. "How does the team think about AI-assisted development? Is anyone already using it in their workflow?"

**About the role:**
6. "What would success look like in this role after six months?"
7. "Is this a new position or a backfill? And where did the previous person go?" (If backfill, this tells you about growth paths.)

**About the business:**
8. "What's the biggest technical challenge the team expects to face in the next year?"

---

## 6. Common Pitfalls and How to Address Them

### Pitfall 1: "You left Thoughtworks in September 2025. What have you been doing since then?"

**What they're really asking:** Is there a gap? Is there a reason you were let go?

**Your answer:** "I left voluntarily. The REA Group engagement was winding down, and I wanted to find a role where I could apply both my cross-platform experience and the AI engineering practices I'd developed. I've been using the time to deepen my skills: working on side projects, staying current with the React ecosystem, and preparing deliberately for my next role."

Keep it positive, forward-looking, and honest. Don't over-explain.

### Pitfall 2: "Seven years at two companies. Is that enough variety?"

**What they're really asking:** Have you seen enough different problems?

**Your answer:** "I'd argue the variety is there if you look at the projects. At Thoughtworks alone, I went from leading a 100-person cross-platform effort for Porsche, to full-stack development for Australia's largest property platform, to building AI-assisted development tools. And the earlier role at the smaller company was completely different: solo development, IoT, government sector. I've seen a pretty wide range."

### Pitfall 3: "Your English. How comfortable are you in an all-English environment?"

**What they're really asking:** Will communication be a problem?

**Your answer:** "At REA Group, I worked daily with Australian and Indian colleagues: standups, code reviews, architecture discussions, all in English. I also wrote documentation and specs in English. I'm not a native speaker, but I'm comfortable and I've done it. If you want to test it, I'm happy to do the rest of this interview in English."

Confidence, not defensiveness. You've already done the thing they're worried about.

### Pitfall 4: "You mentioned AI-assisted development prominently. Some engineers see that as a crutch."

**What they're really asking:** Can you actually code without AI?

**Your answer:** "Fair question. I've been coding for seven years. Five of those were before AI tools were useful. The things I use AI for are mechanical: generating test boilerplate, running pre-commit checks, scaffolding specs. I don't use it for architectural decisions or anything where I can't verify the output. Think of it as a very fast junior developer who never gets tired: useful for throughput, but needs supervision."

---

## Practice Checklist

- [ ] Self-introduction flows naturally and hits 90 seconds
- [ ] Can tell each project story in 3 minutes without notes
- [ ] Have a specific example ready for each behavioral question
- [ ] Can whiteboard React Fiber / Hooks internals without prep
- [ ] Have 3-4 thoughtful questions picked out for the interviewer
- [ ] Have honest, confident answers for all four pitfalls
- [ ] Read everything aloud at least once (catches awkward phrasing)

---

*Generated from Chinese resume. Review and personalize before using.*
