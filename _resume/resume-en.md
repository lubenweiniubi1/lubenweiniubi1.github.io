<table><tr>
<td><img src="avatar.jpg" width="80" style="border-radius:6px;" /></td>
<td>

# Linfeng Pan

> 7+ Years of Frontend Engineering | B.Eng. Software Engineering | linfeng.pan3@gmail.com | +86 15094041848

</td>
</tr></table>

## Professional Summary

Frontend engineer with **7+ years of experience**, focused on React, TypeScript, and micro-frontend architecture. I have led the adoption of **qiankun micro-frontends** in production, splitting a large-scale dealer management Web Admin into independent sub-applications with cross-app communication, style isolation, and independent deployment pipelines. I also bring hands-on experience with **English-language collaboration** — daily meetings, documentation, and code reviews with teams across Australia and India during my time at Thoughtworks.

I am comfortable across the full frontend engineering spectrum: build tooling and CI/CD (Webpack, Vite, Monorepo, GitLab CI/CD), cross-platform architecture (Taro, four-platform component reuse), performance optimization, and quality baseline enforcement. Strong background in WeChat Mini Programs and cross-platform development.

---

## Core Skills

| Category | Technologies |
|---|---|
| **Frontend Frameworks** | React, Next.js, Redux Toolkit, React Router, Ant Design |
| **Micro-Frontends** | **qiankun**, Module Federation — sub-app splitting, cross-app communication (props / global state), style isolation (Shadow DOM / CSS Scope), independent deployment |
| **Languages** | TypeScript, JavaScript (ES6+), HTML5, CSS3 / Sass / Less / Tailwind |
| **Build Tooling** | Webpack 5, Vite, Lerna, Yarn Workspace (Monorepo), ESLint, Prettier |
| **CI/CD** | GitLab CI/CD pipeline configuration, automated build → test → deploy |
| **Cross-Platform** | TaroJS, WeChat Mini Program (native), Douyin Mini Program, H5 |
| **Testing** | Jest, React Testing Library, Enzyme, TDD |
| **Performance** | Route-level lazy loading, code splitting, CDN + WebP image delivery, virtual scrolling, first-screen optimization |
| **API Integration** | HTTP, RESTful API conventions; smooth collaboration with backend teams |

---

## Work Experience

### Thoughtworks | Senior Frontend Engineer | Jan 2021 – Sep 2025

#### Porsche Nationwide Dealer Management System (2021 – 2024) — Frontend Lead

Core business platform for Porsche's nationwide dealer network in China, spanning four surfaces: WeChat Mini Program, Douyin Mini Program, Web Admin, and H5. Features included intelligent vehicle recommendations, new car catalog, dealer management, and sales modules. Team size: 100+.

**Tech stack:** React, TypeScript, Redux Toolkit, qiankun, TaroJS, Webpack, GitLab CI/CD

- **Micro-frontend architecture:** The Porsche dealer B-side Web Admin needed to run as a set of micro-frontend sub-applications. I led the **qiankun micro-frontend implementation**, splitting the dealer management module into independent sub-apps. This involved sub-app lifecycle management (register, mount, unmount), cross-application communication (props passing + shared global state), CSS style isolation (Shadow DOM + CSS Module), and independent build and deploy pipelines — allowing each sub-app to iterate and release independently without affecting the main framework.

- **Cross-platform migration:** Led the **WeChat → Douyin Mini Program migration**. The core challenges were Taro API compatibility gaps and animation performance degradation on the Douyin runtime. Researched alternative API approaches and rewrote the animation layer, achieving ~70% code reuse and establishing a repeatable migration playbook for future cross-platform work.

- **Monorepo component library:** Built a cross-platform component library using Taro + Lerna / Yarn Workspace Monorepo, delivering 15+ shared business components — vehicle cards, dealer selectors, unified forms — reused across all four platforms, eliminating duplicate UI development.

- **Engineering infrastructure:** Set up GitLab CI/CD pipelines (Lint → Test → Build → Deploy). Drove adoption of ESLint standards, Code Review process, and TDD practices to establish the team's frontend quality baseline.

- **Performance optimization:** Addressed slow page loads and long-list scrolling lag in the dealer system. Introduced route-level lazy loading and component-level code splitting to reduce initial bundle size, implemented CDN + WebP image delivery, and tuned virtual scrolling and complex animation performance. Reduced first-screen load time on critical pages by over 35%.

---

#### REA Group — Australia's Largest Real Estate Platform (2024 – 2025) — Frontend Engineer

Maintained and developed features for realcommercial.com.au and realestate.com.au, serving millions of users. Daily English collaboration with teams across Australia and India.

**Tech stack:** React, TypeScript, Next.js, Jest, React Testing Library, CI/CD

- Developed core frontend features (React + TypeScript + Next.js), integrating with backend APIs following RESTful conventions.
- Maintained CI/CD pipelines (build → unit test → automated deploy), ensuring every commit passed automated quality verification.
- Diagnosed and resolved production incidents to keep core business running. Maintained cross-team code health monitoring.
- Built custom Agent Skills on Claude Code, integrating AI-driven development into requirement breakdown, unit testing, and code review workflows.

---

#### Other Projects

**Leasing System — Mini Program + Web (React, Jest, React Testing Library)**
- Built both the mini program and web application from the ground up. Made independent frontend architecture decisions and contributed to technical design. Wrote unit and integration tests covering core business flows.

**KPI Dashboard / Contract Management System (React, ECharts)**
- Developed data visualization dashboards to replace manual Excel reporting. Refactored legacy frontend code, significantly improving maintainability.

### Xi'an Feifeng Technology | Frontend Engineer | Oct 2019 – Jan 2021

#### Rural Revitalization Public Restroom IoT Management System

**Tech stack:** Native WeChat Mini Program, React, Ant Design, ECharts, IoT sensor integration, GPS tracking

- As the sole frontend developer, independently delivered both the consumer-facing WeChat Mini Program and the Web Admin portal — covering the full lifecycle from requirements through delivery.
- Integrated IoT data APIs for real-time restroom occupancy display and dynamic route navigation.
- Built real-time GPS vehicle tracking and route visualization using a map SDK.
- Independently developed the internal management system frontend (React + Ant Design) and coordinated HTTP API integration with the backend team.

### Changjiang Electronics Co., Ltd | Jul 2019 – Sep 2019

- Talent reserve program (frontend development)

---

## Education

| Period | Institution | Degree |
|---|---|---|
| 2014 – 2019 | Northwest A&F University | B.Eng. Software Engineering |

---

## Language

| Language | Proficiency | Notes |
|---|---|---|
| **English** | Working proficiency | Experience in English-speaking environments: English requirement documents, daily meetings, technical documentation, English code reviews, collaboration with teams in Australia and India |
| Chinese | Native | — |
