# Talent & Workforce Operations Desk (Portfolio Demo)

> An enterprise-grade, full-cycle **Applicant Tracking System (ATS)**, **Workforce Management**, and **Legal Document Automation Platform** designed and engineered by **Daliya Chakraborty**.

---

## 🌟 Overview & Architecture

This repository hosts the **Standalone Portfolio & Showcase Edition** of the Manastej Talent & Workforce Platform. It contains a high-fidelity, self-contained client-side simulation engine with realistic synthetic datasets, allowing engineering leaders, recruiters, and collaborators to interact with all platform capabilities without needing private database credentials or internal SMTP credentials.

### Key Functional Pillars

1. **Full-Cycle Applicant Tracking System (ATS)**
   - Multi-pipeline recruitment workflows: **Engineering & AI/ML**, **Growth Marketing**, **Human Resources**, and **Clinical Psychology**.
   - AI-assisted candidate fit scoring (0–100), automated skill rubric extraction, and candidate stage management (`Applied` ➔ `Shortlisted` ➔ `Interview Scheduled` ➔ `Offer Extended` ➔ `Hired`).
   - Integrated candidate communication triggers (Direct WhatsApp connect, automated email staging).

2. **Operations & Workforce Desk**
   - Live roster tracking active employees across departments with document completion statuses.
   - Real-time work shift station with working mode selection (`Remote / WFH`, `Flexible Slot`, `Office`, `Field Site`).
   - Leave management engine: submission, multi-tier approvals, and leave balance tracking.
   - Agile team task board with assignee filters, priority tags, and status lifecycle management.

3. **Dynamic Legal Document Automation Engine**
   - **2-Page Standard A4 Offer Letter Generator**: Generates formal appointment contracts with dynamic compensation, tenure, probation, notice period, and project scope.
   - **Executive Founder Signature & Seal Integration**: Automated layout engine positioning corporate seals, founder signature blocks, and candidate counter-sign spaces.
   - **Equity Terms Toggle**: Flexible allocation configuration for equity-eligible positions vs intern contracts.
   - **Mutual Confidentiality Agreement (NDA) Generator**: Prepares enforceable bilateral non-disclosure documents with automated party identification.
   - **Standalone & Batch Dispatch Pipeline**: Generate and dispatch Offer Letters alone, NDAs alone, or coupled packages.

4. **Multi-Tier Role-Based Access Control (RBAC)**
   - **Founder & Super Admin**: Unrestricted administrative oversight across all pipelines, workforce directories, integrity logs, and credential resets.
   - **HR Operations Lead**: Full operational authority over applicant pipelines, leave reviews, and onboarding workflows.
   - **Software Engineer / Intern**: Personalized daily desk, time-tracking shift station, task queue, and personal document vaults.

---

## 🛠️ Technology Stack

- **Frontend Core**: Vanilla JavaScript (ES2022+), Semantic HTML5, CSS Grid & Flexbox, CSS Variables.
- **Design System**: Typography via *Plus Jakarta Sans*, *Manrope*, and *JetBrains Mono*; custom design tokens.
- **Client Mock Engine**: In-memory Service Mock Interceptor simulating RESTful `/api/*` interactions with local state persistence via `localStorage`.
- **Deployment & Hosting**: Optimized for Vercel Edge / Static Hosting with zero cold-starts and instant responsiveness.

---

## 🚀 Live Demo & How to Test

1. **Visit the Live Deployment**: [Vercel Live Preview](https://hiring-portal-demo.vercel.app)
2. **Switch Roles**: Use the interactive **Role Switcher** in the top banner to experience the portal as:
   - 👑 *Founder & Admin*
   - 📋 *HR Operations Lead*
   - 💻 *Software Engineer Intern*
3. **Try Document Generation**: Click **More tools ➔ Generate standalone offer** to configure terms, preview the 2-page A4 offer letter, and simulate document dispatch.
4. **Try Shift Tracking**: Navigate to the **Today** workspace, pick your working mode, and clock in with live stopwatch tracking.
5. **Reset Anytime**: Click **↺ Reset Data** in the top banner to restore the pristine synthetic dataset at any moment.

---

## 👤 Author

**Daliya Chakraborty**  
- **Role**: Founder & Product Architect, Manastej  
- **Email**: [founder@manastej.com](mailto:founder@manastej.com)  
