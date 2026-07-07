# English Interview Prep — Linfeng Pan

---

## 1. Self-Introduction (1–2 Minutes)
Cue note:
 **名字+角色+工作年限**
> Hey, I'm Linfeng Pan. I do frontend. About seven years now.

技能 + 工作经历 + 客户
> My main skills are React, Next.js, and TypeScript and their ecosystem. I worked at Thoughtworks for a long time. Almost five years. My two big clients there were Porsche and REA Group.

详细介绍客户保时捷：
项目角色 + 项目介绍 + 我做了什么

> At Porsche, I led the frontend team. We built a car sales system that covered four platforms — WeChat, Douyin, H5, and Web Admin. The mini programs shared code through TaroJS. I led the cross-platform component library  — chose the tech stack, designed the architecture — write once, run on three platforms. The Web Admin was a separate repo — dealers used it to manage leads and their car listings, new and used. Different stack, different UI. 

项目角色 + 项目介绍 + 团队成分 + 我做了什么（AI）
> After Porsche, I joined REA Group. They run the biggest property websites in Australia. I worked on the frontend and the backend layer. My team was in three countries — Australia, India, and  China. I talked with my teammates every day in English. That was also when I started using AI tools in my work. I built some custom tools for the team. It made our work a lot faster.
>
> So yeah, that's me.  

---

## 2. Behavioral Questions — STAR Talking Points

### Q: Tell me about a challenging project.

**Map to:** Porsche WeChat → Douyin Mini Program Migration

- **Situation:** Porsche had a car sales app on WeChat, built with TaroJS. The business wanted to be on Douyin too. Douyin is TikTok for China — way more users, way more traffic. But the whole app was huge. I couldn't move everything. So I picked the most important part: the car series module. That's where customers browse cars and leave their contact info. Dealers get their leads from there. So it had to work.
- **Task:** Move the car series module from WeChat to Douyin. No full rewrite. The whole app stays on WeChat, but this core feature needs to work on both.
- **Action:** I checked every API the module used. Many APIs worked differently on Douyin. Some just didn't work at all. The animations were the biggest problem. Smooth on WeChat. But on Douyin? Very slow. So I rewrote the animation system for this module. 
- **Result:** I kept about 70% of the code for that module. Later, what I learned from this helped the team move more features over. I also wrote down every problem and how I fixed it. That document became the team's go-to reference.

### Q: Tell me about a time you led a technical initiative.

**Map to:** Cross-platform component library or AI engineering pipeline

- **Situation:** Porsche had three mini programs — WeChat, Douyin, H5. They shared code through TaroJS. But each platform team was building their own buttons, cards, forms. Same thing, done three times. Looked different everywhere. Wasted a lot of time.
- **Task:** Build one cross-platform component library. Write once, run on all three.
- **Action:** I picked the tech stack — Lerna + Yarn Workspace monorepo. Designed the component APIs to work with Taro's compile step. Set the architecture: each component hides platform differences inside, looks the same outside. Led the team to build 15+ components. I chose the tools, designed the approach. The team built the components.
- **Result:** No more duplicate UI work. Components built once, used on WeChat, Douyin, and H5. New features shipped on all three at the same time. Teams moved faster.

### Q: How do you handle disagreements in code review?

**Map to:** Thoughtworks engineering culture

- **Situation:** At Thoughtworks, we reviewed code every day. My code was checked by people in Australia and India. Sometimes they saw problems I missed.
- **Action:** I split things into two groups. Style problems and real problems. Style? Check the ESLint rules. If the tool says it's fine, it's fine. Real problems? I ask them to explain what they're worried about. Most of the time they were right. They found edge cases I didn't think about. When I think I'm right, I don't just say "my way is better." I show a real example.
- **Result:** I learned that review is a talk, not a fight. After a while, I made a rule for myself: every review comment should have either a clear suggestion or a real question. No "I don't like this" with no reason. When I later became a lead, I brought that same rule to the team. It worked well.

### Q: Describe a time you solved a production issue.（待修改）

**Map to:** REA Group incident response

- **Situation:** We pushed new code at REA Group. A key page broke. Real users saw errors on the property listing page.
- **Task:** Find the bug and fix it fast.
- **Action:** I checked the dashboards. Found the broken part. Tracked down the cause: the backend changed a data shape, but the frontend didn't check for null. I rolled back first — get the site working. Then talked with the backend team. Fixed the data shape. Added null checks. Wrote a test so it wouldn't happen again.
- **Result:** Site was back in 30 minutes. The test went into our CI. Now that kind of bug gets caught before it goes live.

### Q: How do you learn new technology?

**Map to:** AI-assisted development journey

- **Situation:** Around 2023, AI coding tools got really good. I didn't want to just use them as smart autocomplete. I wanted to really learn how to use them well.
- **Action:** I tried Claude Code on my daily work. Watched where it helped and where it didn't. Good at tests and boring code. Not so good at business logic. I built custom Agent Skills over time. One for requirements. One for tests. One for code review. Each one had clear rules I learned from trying things out.
- **Result:** My personal test turned into a team tool. Everyone started using the skills. The test skill helped the most — not because it wrote perfect tests, but because starting from a draft is way easier than starting from a blank file.

### Q: Tell me about a time you worked across cultures or time zones.

**Map to:** REA Group Australia-India-China collaboration

- **Situation:** My team at REA was in three countries. Melbourne, India, and me in China. Big time differences. Different ways of talking.
- **Action:** I changed my work hours. My afternoon = their morning. I joined standups and pair sessions. For written stuff, I learned to be very clear. In China, people often don't say things directly. That doesn't work with an international team. So I wrote long PR descriptions. I recorded videos of my changes. I also joined the casual stuff — group chats, virtual coffee. It sounds small, but it helps when people are far apart.
- **Result:** We shipped on time, every time. My tech lead in Australia told me my communication was really good. It wasn't about perfect English. It was about changing how I talk to fit the team.

---

## 3. HR & Culture Questions

These ones come up a lot. The interviewer just wants to know you're normal, you won't burn out in three months, and you'll fit in with the team.

### Q: Why did you leave your last job?
公司业务缩减 + 领大礼包 + 想要沉淀
> Last year my company went through a round of business downsizing. My team was affected. I got a severance package and left on good terms. Honestly, it happens. Companies restructure all the time. No hard feelings. I took it as a chance to step back and think about what I really want next. I'm not in a rush. I want the right role, not just any role.

### Q: What were your strengths in your last role?

I'd say two things. 

跨国合作经验

One, I'm really used to working with teams across countries. At REA Group, my teammates were in Australia and India. English was the working language, no issues there. I learned how to make remote work actually work — clear writing, screen recordings, not just showing up to meetings. 

前端lead经验

Two, I've led a frontend team before. At Porsche I was the lead across four platforms. I know how to set standards, run reviews, and get people on the same page. But I also still write code every day. I'm not the kind of lead who just sits in meetings.

### Q: How do you feel about overtime?

> I don't mind working late when there's a real reason. A production issue? Someone has to fix it. A deadline that really can't move? I'll be there. But if overtime is happening all the time, that's usually a planning problem, not a hard-work problem. I'd rather fix the planning. Good teams ship on time without burning people out. That's what I aim for.

### Q: How do you balance work and life?

> I keep it simple. During work hours, I work. I don't scroll my phone. I don't wander off for two hours. When the workday ends, I stop. I go exercise. I play some games. I get some sleep. Next morning I'm fresh and ready. If you're always half-working and half-resting, you do both badly. I try to do each one properly.

### Q: What do you do outside of work?

> Three things mostly. I work out — keeps my brain working when the code doesn't. I play video games — been a gamer since I was a kid. And... yeah, I read tech stuff. Docs, blog posts, whatever. I know that sounds like more work, but I actually enjoy it. It's not homework. It's just interesting.

---

## 4. Project Walkthroughs (3-Minute Stories)

### Porsche Car Sales System

> 3 years on this project. Porsche's car sales platform for China. Lots of dealers. Big team — over 100 people.
>
> I was the frontend lead. Four platforms to take care of. WeChat Mini Program for dealers on the road. Douyin Mini Program too. H5 for quick phone access. And the Web Admin — that's where dealers managed their leads, new car listings, used cars, all that.
>
> The cross-platform part was the fun part. The mini programs — WeChat, Douyin, H5 — shared code through TaroJS. Three platforms, one codebase. The UI components were cross-platform too — I led the cross-platform library, chose the tools, designed how it all fit together. Write once, compile to all three. That was the tricky bit. Each platform had its own quirks, but the component handled that inside. The Web Admin was completely separate. Different stack, different UI. Its own component library. Two worlds, but I led both.
>
> The Douyin move was the big moment. Douyin has way more users than WeChat. The business wanted that traffic. But the whole app was too big. I couldn't move everything at once. So I picked the car series module — that's where customers browse cars and leave their contact info. Dealers get leads from it. So it was the one feature that couldn't wait. Taro's Douyin support was not great yet. APIs didn't match. Animations were slow. I rewrote the animations myself. Tweaked the approach until it ran smooth on both platforms. Kept about 70% of the code for that module. Later, the team used what I learned to move more features over.
>
> I also brought in better process. Strict lint rules. Required code reviews. Tests for important logic. People didn't like it at first. Then the bugs went down. Then they liked it.

### REA Group

> REA Group runs the top property sites in Australia. Millions of people use them every month.
>
> My team worked on both sites. Stack was React, TypeScript, Next.js on the front. Node.js and Express on the back. I did both. First time on a real international team. Daily standups with Melbourne and India.
>
> Two things I remember most. One: the code quality bar was high. Every commit had to pass lint, types, unit tests, integration tests. All of it. Before anyone even read your code. I used to push for this at Porsche. Here it was just normal. That felt good.
>
> Two: this is where AI tools started to make sense for a whole team. I started with Claude Code on my own. Then I built Agent Skills that anyone could use. The test skill knew our setup. Knew our patterns. Point it at a new component, get a test draft in seconds. Not perfect, but way better than an empty file.
>
> Big thing I learned: AI tools don't fix bad code. They make good code better. Clean project, clear rules — the AI output is useful. Messy project — the AI just makes mess faster.

### IoT Rural Restroom Management

> First job after school. I was the only frontend person. That meant I did everything. Build, test, ship.
>
> The product: sensors in public restrooms, all over rural China. They tracked how many people were inside. Government workers used it to plan cleaning routes.
>
> I made two apps. A WeChat Mini Program for the workers — live restroom data, maps with routes, GPS tracking for cars. And a React admin site for the office. The mini program was the hard one.
>
> Being the only developer that early teaches you everything the hard way. Nobody to check your ideas. Fixing bugs alone at night. Explaining tech stuff to people who just want it to work. It also showed me why code review and tests matter so much. I pushed hard for those later at Thoughtworks because I knew what happens without them.

---

## 5. Questions to Ask the Interviewer

1. **Engineering culture:** "How does code review work on your team? How do you know when code is ready to ship?"
2. **Tech problems:** "What's the hardest tech problem the team has right now?"
3. **Teamwork:** "How do frontend, backend, and design people work together?"
4. **Growth:** "If I join, what should I get done in the first six months?"
5. **AI tools:** "Does the team use AI tools for coding? "
6. **Remote work:** "Is the team in different places? I've worked across time zones before. How do you handle it?"
7. **Old code:** "How do you split time between new things and cleaning up old code?"

---

## 6. Common Pitfalls & How to Handle Them

| Potential Concern | How to Answer |
|---|---|
| **"You left Thoughtworks with no next job."** | "I was there almost five years. I didn't want to take the first job I found. I wanted to pick carefully. Been learning new things and thinking about what I really want." |
| **"There's a gap after graduation."** | "I worked at an electronics company for three months. It was a training program, not real dev work. I knew very fast I wanted to write code, not work in a factory. So I moved to a tech company." |
| **"Your experience is all Chinese companies."** | "Thoughtworks is global. I spoke English every day with teams in Australia and India. The product I worked on was for Australian users. Millions of them. The international part was my real daily life." |
| **"Seven years, but no famous tech company."** | "I chose hard problems over big names. Porsche runs dealers across all of China. REA Group is the biggest property site in Australia. These are real products with real users. And Thoughtworks is known for serious engineering, even if it's not FAANG." |

---

*Made from `notes/resume/resume.md`. Read it out loud before the interview. If a sentence feels hard to say, change it to something easier.*
