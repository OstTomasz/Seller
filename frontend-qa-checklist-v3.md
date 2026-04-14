# Frontend QA Checklist v3 — Seller CRM

**Source:** code-derived feature map + browser smoke pass  
**Roles:** Director (DIR) | Deputy (DEP) | Advisor (ADV) | Salesperson (SP)  
**Status:** ✅ Checked by agent | 👤 Manual check needed | ⚠️ Issue found | ⏭️ Skipped (blocker/env)

---

## 1. AUTH

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 1.1 | Login with valid credentials | DIR, DEP, ADV, SP | ✅ | Browser pass + demo credentials on login page. |
| 1.2 | Invalid credentials handling | DIR, DEP, ADV, SP | 👤 | Not fully re-run in this pass. |
| 1.3 | Force password change route (`/change-password`) | Users with `mustChangePassword=true` | 👤 | Feature exists in code; needs seed case validation. |
| 1.4 | Logout and redirect to `/login` | DIR, DEP, ADV, SP | ✅ | Verified repeatedly in browser. |
| 1.5 | Protected route redirect without token | All protected routes | 👤 | Route guards present in `AppRouter`; not executed as isolated no-token scenario this pass. |

---

## 2. NAVIGATION & RBAC

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 2.1 | Sidebar/top nav items per role | All roles | ✅ | Verified vs code (`navLinks.ts`) and browser. |
| 2.2 | `/management` access guard | DIR, DEP allowed; ADV, SP denied | ✅ | Code guard in `AppRouter` + role menu behavior verified. |
| 2.3 | `/archive` access guard | DIR allowed; DEP, ADV, SP denied | ✅ | Code guard in `AppRouter` + menu behavior verified. |
| 2.4 | Active link highlighting and route transitions | All roles | ⚠️ | URL changes before view swaps; perceived lag/inconsistency. |

---

## 3. DASHBOARD & CALENDAR

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 3.1 | Dashboard render (`/`) with calendar + notifications panel | All roles | ✅ | Verified in browser. |
| 3.2 | Calendar controls (today/month/week/agenda/nav) | All roles | ✅ | Visible and interactive in browser. |
| 3.3 | Create/edit/delete event flow | All roles by permission | 👤 | Components present; full CRUD not executed end-to-end in this pass. |
| 3.4 | Mandatory event capability | DIR, DEP only | 👤 | Logic present in `CreateEventModal`; needs manual submit verification. |
| 3.5 | Invitation response (accept/reject) | Invitees | 👤 | UI and service hooks exist; not fully executed this run. |
| 3.6 | Conflict handling on create/edit/drag | All roles | 👤 | Needs deliberate conflict scenarios. |

---

## 4. CLIENTS LIST (`/clients`)

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 4.1 | Client list visibility scope | Role-scoped | ✅ | Verified by role + code-level checks. |
| 4.2 | Search/filter/sort/pagination UI | By role config | ✅ | Controls visible and functional in smoke pass. |
| 4.3 | Row actions RBAC (`Archive` vs `Request archive` vs none) | Role-scoped | ✅ | Verified in browser and `ClientsTable.tsx`. |
| 4.4 | Open client details from row | All roles with access | ✅ | Verified. |
| 4.5 | Add client modal open and multi-step flow | DIR, DEP, ADV, SP | 👤 | Opened partially; full validation path still manual. |

---

## 5. CLIENT DETAILS (`/clients/:id`)

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 5.1 | Detail page sections render (basic, addresses, notes, others) | All roles | ✅ | Verified. |
| 5.2 | Assignment section visibility/editability | ADV/DEP/DIR (SP hidden) | ✅ | Verified against UI + `ClientPage.sections.tsx`. |
| 5.3 | Address/contact CRUD modals | Role-scoped | 👤 | Components present; full data mutation paths manual. |
| 5.4 | Notes CRUD + cross-role edit/delete restrictions | Role-scoped | 👤 | Logic present; needs explicit negative-path pass. |
| 5.5 | Reassignment flow with password confirm | DEP, DIR | 👤 | Needs full submit-path check. |

---

## 6. COMPANY (`/company`)

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 6.1 | Tab switch: `structure` / `documents` | All roles | ✅ | Verified in browser. |
| 6.2 | Structure tree: search + expand/collapse + user links | All roles | ✅ | Verified. |
| 6.3 | Documents read actions (list/preview/download) | All roles | ✅ | Verified visibility; preview/download click path partially checked. |
| 6.4 | Documents write actions (upload/create/delete) | DIR only | ✅ | RBAC and controls verified (`CompanyDocumentsPage`). |
| 6.5 | Documents mutation success/error UX | DIR | 👤 | Full upload/delete action cycle not run in this pass. |

---

## 7. MANAGEMENT (`/management`)

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 7.1 | Management entry and tabs (`structure/users/regions`) | DIR, DEP | ✅ | Verified. |
| 7.2 | Scope limiting for deputy (own superregion) | DEP | ✅ | Visible dataset indicates scope filtering; code confirms. |
| 7.3 | Structure actions: add/edit/remove/assign position | DIR, DEP by policy | 👤 | UI available; full mutation matrix manual. |
| 7.4 | Users tab: create/edit/archive/reset password flows | DIR, DEP by policy | 👤 | Modals/hooks present; partial smoke only. |
| 7.5 | Regions tab: create/move/edit/delete region/superregion | DIR, DEP by policy | 👤 | Requires controlled data and sequential action checks. |

---

## 8. ARCHIVE (`/archive`)

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 8.1 | Archive page access and tabs (`clients`, `employees`) | DIR | ✅ | Verified. |
| 8.2 | Archived clients list behaviors (search/filter/sort/pagination) | DIR | ✅ | Verified. |
| 8.3 | Client unarchive modal + action | DIR | 👤 | Modal path exists; full mutation still manual in this pass. |
| 8.4 | Archived employees list behaviors | DIR | 👤 | UI exists; tab-specific pass partially skipped. |
| 8.5 | Employee unarchive flow | DIR | 👤 | Exists in code/UI; needs end-to-end execution. |

---

## 9. NOTIFICATIONS

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 9.1 | Notifications panel visibility + unread count | All roles | ✅ | Verified on dashboard/topbar. |
| 9.2 | Mark read/unread/delete | All roles (own notifications) | 👤 | Action handlers present; not fully exhaustively executed. |
| 9.3 | Notification detail modal content | All roles | 👤 | Modal exists; needs full type-by-type pass. |
| 9.4 | Archive/unarchive approve/reject actions from notifications | DIR | 👤 | Role-gated in code; manual full action pass needed. |
| 9.5 | Deep link from notification to related entity | By notification type | 👤 | Needs matrix by notification type. |

---

## 10. SETTINGS (`/settings`)

| # | Functionality | Roles | Status | Notes |
|---|---|---|---|---|
| 10.1 | Profile form render (avatar/workplace/about) | All roles | ✅ | Verified. |
| 10.2 | Save changes button enable/disable behavior | All roles | ✅ | Verified disabled state when unchanged. |
| 10.3 | Unsaved changes guard on navigation | All roles | 👤 | Feature exists in code; not deliberately triggered. |
| 10.4 | Password change form and submit | All roles | 👤 | Fields/buttons verified; full submit paths manual. |
| 10.5 | Avatar upload constraints and error UX | All roles | 👤 | Needs explicit file-size/type test. |

---

## 11. ROUTE-LEVEL ROLE MATRIX (deduplicated)

| # | Route / Feature Area | Roles | Status | Notes |
|---|---|---|---|---|
| 11.1 | Dashboard | DIR, DEP, ADV, SP | ✅ | |
| 11.2 | Clients | DIR, DEP, ADV, SP | ✅ | |
| 11.3 | Company | DIR, DEP, ADV, SP | ✅ | |
| 11.4 | Management | DIR, DEP | ✅ | Guarded by `RoleRoute`. |
| 11.5 | Archive | DIR | ✅ | Guarded by `RoleRoute`. |
| 11.6 | Settings | DIR, DEP, ADV, SP | ✅ | |

---

## UX/UI Issues Found (current pass)

1. **⚠️ Route/view desynchronization (critical UX)**
   - URL changes immediately after nav click, but previous view remains visible for noticeable time.
   - Users can perceive clicks as ignored or double-trigger actions.
   - Recommendation: add route-level loading/skeleton state and transition guard.

2. **⚠️ Missing explicit loading skeletons during heavy view switches**
   - Several pages show stale content before fresh data appears.
   - Recommendation: per-page skeleton (`Clients`, `Management`, `Company`, `Archive`) + shared suspense fallback.

3. **⚠️ Dev client instability signals**
   - Observed `vite` reconnect warning (`server connection lost. Polling for restart...`) during run.
   - Can amplify UX jitter during QA and manual testing.

4. **⚠️ Interaction timing/stale element behavior after navigation**
   - Element references become stale right after route switches; indicates asynchronous UI swap timing issues.
   - Recommendation: disable actionable controls until route/data ready state is resolved.

---

## Suggested Next Verification Pass (manual, high value)

- Full mutation matrix for `Management` modals (`create/edit/archive/reset/move`).
- Full `Notifications` type matrix (open, mark read/unread, link target correctness).
- `Calendar` conflict and invitation edge-cases (edit/drag/respond mandatory).
- `Archive employees` tab full cycle (search/sort/open/unarchive).
- `Settings` avatar constraints + unsaved changes prompt.
