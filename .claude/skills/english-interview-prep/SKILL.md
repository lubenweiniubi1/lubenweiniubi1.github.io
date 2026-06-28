---
name: english-interview-prep
description: Use when the user wants to generate an English resume from their Chinese resume, create English interview preparation materials, or prepare for English-language job interviews
---

# English Interview Prep

Generates a professional English resume and interview preparation materials from the user's Chinese resume, then humanizes all output to sound like a native English speaker.

## Input Files

| File | Purpose |
|------|---------|
| `notes/resume/resume.md` | Chinese resume (primary source) |
| `notes/dist/简历/潘林峰的简历-v3-中文.md` | Alternative Chinese resume (if above is stale) |

## Workflow

Run these steps in order. Do NOT skip humanization (Step 3).

### Step 1: Generate English Resume

1. Read the Chinese resume from `notes/resume/resume.md`
2. Ask the user: **"Do you have a specific job description to tailor the resume for?"**
   - **If yes:** Invoke the `tailored-resume-generator` skill with the JD + Chinese resume content. The skill will tailor the English resume to the target role.
   - **If no:** Generate a general professional English resume directly, translating and adapting all sections: contact info, professional summary, core skills, work experience (with quantified achievements), projects, and education.
3. Save the output to **`notes/resume/resume-en.md`**
4. Confirm the English resume accurately reflects the Chinese source (no fabricated metrics, all dates correct)

### Step 2: Generate English Interview Prep

Based on the English resume created in Step 1, generate an interview preparation document covering:

1. **Self-introduction** — A 1-2 minute elevator pitch based on the resume
2. **Behavioral questions** — Likely questions mapped to work experience, with STAR-format talking points:
   - "Tell me about a challenging project" → map to Porsche or REA Group
   - "Tell me about a time you led a technical initiative" → cross-platform migration or AI workflow
   - "How do you handle disagreements in code review?" → Thoughtworks engineering culture
   - "Describe a time you solved a production issue" → REA Group incident response
   - "How do you learn new technology?" → AI-assisted development journey
3. **Technical deep-dive** — Questions probing the skills listed on the resume:
   - React: Fiber architecture, Hooks internals, performance optimization
   - Cross-platform: Taro architecture, mini-program differences
   - Engineering: Monorepo management, CI/CD, testing strategy
   - AI-assisted dev: How Agent Skills are designed and used
4. **Project walkthrough** — For each major project, a 3-minute structured narrative covering context, role, technical decisions, and measurable outcomes
5. **Questions to ask the interviewer** — 5-8 thoughtful questions tailored to the resume's tech stack
6. **Common pitfalls** — Resume-specific red flags (career gaps, frequent changes) and how to address them honestly

Save to **`notes/10-面试题/english-interview-prep.md`**

### Step 3: Humanize Both Documents

Invoke the `humanizer` skill on BOTH output files from Steps 1 and 2. This is mandatory — the raw output will have telltale AI writing patterns that make the candidate sound less credible.

Focus humanization on:
- Removing AI vocabulary (crucial, pivotal, showcasing, underscoring, etc.)
- Replacing formulaic structures (rule-of-three lists, em dashes, -ing padding phrases)
- Adding natural sentence rhythm variation
- Making achievement descriptions sound conversational, not press-release
- Keeping professional tone but removing promotional/salesy language

After humanization, update both files with the final versions.

## Post-Completion

After all three steps, tell the user:
- Where both files are saved
- Suggest they review the interview prep aloud (to catch anything that doesn't sound natural spoken)
- Remind them to update the resume with any missing recent projects or skills
