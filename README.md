# 💼 Seller – Modern CRM Solution

**Seller** is a professional, full-stack **CRM (Customer Relationship Management)** application. It is built using a **monorepo architecture** that ensures a unified codebase with high type safety and seamless integration between the frontend, backend, and shared logic.

> [!IMPORTANT]
> **AI-Powered Development:** This entire project was fully developed, refactored, and deployed with the assistance of **AI (primarily Claude)**. It serves as a testament to efficient human-AI collaboration in modern software engineering.

**Live Demo:** [seller-crm-tau.vercel.app](https://seller-crm-tau.vercel.app)

---

### ⚡ Performance & Hosting Note

Please be patient with the application's loading speed. The project is hosted on **free tiers** (**Vercel Serverless Functions** and **MongoDB Atlas**). These services may experience "cold starts" or latency during the first request of a session, but they fully support all system functionalities.

---

### 🛠️ Tech Stack & Dependencies

The codebase is **98.0% TypeScript**, ensuring maximum type safety from the database models to the UI components.

#### **Frontend (Client)**

- **Framework:** **React 19.2** with **Vite 7.3** for ultra-fast development.
- **State Management:** **Zustand 5.0** for global state and **TanStack React Query 5.90** for server-state synchronization.
- **Styling & UI:** **Tailwind CSS 4.2**, **Shadcn UI**, and **Radix UI** primitives.
- **Animations:** **Framer Motion 12.3** for smooth interface transitions.
- **Routing:** **React Router 7.13**.
- **Forms:** **React Hook Form** with **Zod** resolvers for schema-based validation.
- **Icons & Assets:** **Lucide React**, **React Icons**, and **Simple Icons**.
- **Calendar:** **React Big Calendar** with **Day.js** for event management.

#### **Backend (Server)**

- **Runtime:** **Node.js** with **Express 5.2**.
- **Database:** **MongoDB** with **Mongoose 9.2** for document modeling.
- **Security:** **JSON Web Tokens (JWT)** for authentication, **Bcryptjs** for password hashing, **Helmet** for secure headers, and **Express Rate Limit** to prevent abuse.
- **Validation:** **Zod 4.3** for strict API request/response validation.
- **Logging:** **Morgan** for HTTP request logging.

#### **Infrastructure & Tooling**

- **Monorepo:** Managed via **pnpm workspaces** (client, server, shared).
- **Shared Logic:** A dedicated `@seller/shared` package to ensure consistency across the stack.
- **Testing:** **Vitest 4.0** for unit/integration testing and **Supertest** for API testing.
- **Code Quality:** **ESLint**, **Prettier 3.8**, and **Madge** for circular dependency detection.
- **Deployment:** **Vercel** with custom routing configuration (`vercel.json`).

---

### 🛡️ Security & RBAC (Role-Based Access Control)

The application implements a robust **RBAC** system to ensure enterprise-grade data security:

- **Granular Permissions:** Access to specific modules (Clients, Company, Menagment, Archive) is restricted based on user roles (Director, Deputy, Advisor and Salesperson).
- **Secure Middleware:** Role verification is enforced on the server-side for every sensitive API request.
- **Conditional UI:** The interface dynamically adapts, hiding or disabling features that the current user is not authorized to use.

---

### 🚀 Key Features

- **Advanced Client Management:** Detailed client profiles with integrated **breadcrumb navigation**.
- **Dynamic Calendar:** Full-featured scheduling system integrated with client data.
- **Smart Notification Engine:** Automated alerts for new company files, added notes, and document updates.
- **Enterprise Document Management:** Structured system for organizing and managing company-wide documentation.

---

### ♻️ Automated Maintenance (CI/CD)

To provide a clean environment for reviewers, a **GitHub Action** is configured to **automatically reset the database every day at midnight (UTC)**

- **Note to visitors:** You are encouraged to create, edit, or delete data to test the system; the environment will be restored to its baseline state daily.

---

### 🏗️ Project Structure

- **`/client`**: The React-based user interface.
- **`/server` & `/api`**: Backend services and serverless entry points.
- **`/shared`**: Shared TypeScript types and Zod schemas.
- **`/.github/workflows`**: CI/CD pipelines including the `reset-db` workflow.
