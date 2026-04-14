# Frontend QA Checklist v2 — Seller CRM

# Po naprawach z rundy 1

**Role:** Director (DIR) | Deputy (DEP) | Advisor (ADV) | Salesperson (SP)
**Status:** ✅ Works | ❌ Broken | ⚠️ Partial | 🔲 Not tested | 💬 Comment | N/A

---

## 1. AUTH


| #    | Feature                                                       | DIR | DEP | ADV | SP  | Comment |
| ---- | ------------------------------------------------------------- | --- | --- | --- | --- | ------- |
| 1.1  | Login with valid credentials                                  | ✅   | ✅   | ✅   | ✅   |         |
| 1.2  | Login with invalid password → error toast                     | ✅   | ✅   | ✅   | ✅   |         |
| 1.3  | Login with non-existent email → error toast                   | ✅   | ✅   | ✅   | ✅   |         |
| 1.4  | Redirect to /change-password when mustChangePassword=true     | 🔲  | 🔲  | ✅   | ✅   | ✅       |
| 1.5  | Force password change — walidacja on blur (nie on type)       | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 1.6  | Force password change — passwords don't match → error on blur | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 1.7  | Force password change — valid submission → redirect /         | 🔲  | 🔲  | ✅   | ✅   |         |
| 1.8  | Logout clears session → redirect /login                       | ✅   | ✅   | ✅   | ✅   |         |
| 1.9  | Sesja per zakładka — dwie zakładki = dwie niezależne sesje    | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 1.10 | Session timeout warning modal                                 | ✅   | ✅   | ✅   | ✅   |         |
| 1.11 | Session timeout auto-logout                                   | ✅   | ✅   | ✅   | ✅   |         |
| 1.12 | Protected route bez tokena → /login                           | N/A | ✅   | ✅   | ✅   |         |
| 1.13 | /management jako ADV/SP → redirect /                          | N/A | N/A | ✅   | ✅   |         |
| 1.14 | /archive jako DEP/ADV/SP → redirect /                         | N/A | ✅   | ✅   | ✅   |         |


---

## 2. NAVIGATION & LAYOUT


| #    | Feature                                                                          | DIR | DEP | ADV | SP  | Comment |
| ---- | -------------------------------------------------------------------------------- | --- | --- | --- | --- | ------- |
| 2.1  | Sidebar — poprawne linki per rola                                                | ✅   | ✅   | ✅   | ✅   |         |
| 2.2  | Active link highlighted                                                          | ✅   | ✅   | ✅   | ✅   |         |
| 2.3  | Topbar — name i role (zgodnie z projektem)                                       | ✅   | ✅   | ✅   | ✅   |         |
| 2.4  | Topbar scrolled state                                                            | ✅   | ✅   | ✅   | ✅   |         |
| 2.5  | Notification bell w topbarze (prawy róg, przed logout) — liczba nieprzeczytanych | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 2.6  | 404 page — stylowo pasuje do layoutu                                             | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 2.7  | Page transitions                                                                 | ✅   | ✅   | ✅   | ✅   |         |
| 2.8  | Mobile sidebar                                                                   | ✅   | ✅   | ✅   | ✅   |         |
| 2.9  | Max-width na tablicach clients/archive na desktopie                              | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 2.10 | Max-width na kalendarzu na desktopie                                             | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 2.11 | Max-width na notifications na desktopie                                          | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |


---

## 3. DASHBOARD


| #   | Feature         | DIR | DEP | ADV | SP  | Comment |
| --- | --------------- | --- | --- | --- | --- | ------- |
| 3.1 | Dashboard loads | ✅   | ✅   | ✅   | ✅   |         |


---

## 4. CLIENTS — LIST (/clients)


| #    | Feature                           | DIR | DEP | ADV | SP  | Comment |
| ---- | --------------------------------- | --- | --- | --- | --- | ------- |
| 4.1  | DIR sees all clients              | ✅   | N/A | N/A | N/A |         |
| 4.2  | DEP sees own superregion          | N/A | ✅   | N/A | N/A |         |
| 4.3  | ADV sees own region               | N/A | N/A | ✅   | N/A |         |
| 4.4  | SP sees own clients               | N/A | N/A | N/A | ✅   |         |
| 4.5  | Search by company name            | ✅   | ✅   | ✅   | ✅   |         |
| 4.6  | Search by NIP                     | ✅   | ✅   | ✅   | ✅   |         |
| 4.7  | Search by city                    | ✅   | ✅   | ✅   | ✅   |         |
| 4.8  | Filter by salesperson             | ✅   | ✅   | ✅   | N/A |         |
| 4.9  | Filter by region                  | ✅   | ✅   | N/A | N/A |         |
| 4.10 | Filter by superregion             | ✅   | N/A | N/A | N/A |         |
| 4.11 | Sort by ID / name / last activity | ✅   | ✅   | ✅   | ✅   |         |
| 4.12 | Pagination (10/20)                | ✅   | ✅   | ✅   | ✅   |         |
| 4.13 | Click company name → /clients/:id | ✅   | ✅   | ✅   | ✅   |         |
| 4.14 | Add client button                 | ✅   | ✅   | ✅   | ✅   |         |


---

## 5. CLIENTS — ADD CLIENT MODAL


| #    | Feature                                                            | DIR | DEP | ADV | SP  | Comment |
| ---- | ------------------------------------------------------------------ | --- | --- | --- | --- | ------- |
| 5.1  | Modal opens                                                        | 🔲  | 🔲  | ✅   | ✅   |         |
| 5.2  | Salesperson select — walidacja wymagana (inline, nie toast)        | 🔲  | 🔲  | 🔲  | N/A | ✅       |
| 5.3  | NIP — walidacja on blur                                            | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 5.4  | NIP duplicate — sprawdza per handlowiec                            | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 5.5  | NIP w archiwum — unarchive request jeśli należał do tego handlowca | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 5.6  | SP — auto-assigned to own position                                 | N/A | N/A | N/A | ✅   |         |
| 5.7  | ADV — assign to salesperson in own region                          | N/A | N/A | ✅   | N/A |         |
| 5.8  | DIR — assign to any salesperson                                    | ✅   | N/A | N/A | N/A |         |
| 5.9  | Postal code auto-format (XX-XXX)                                   | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 5.10 | Cancel z niezapisanymi zmianami → confirm                          | 🔲  | 🔲  | 🔲  | ✅   |         |


---

## 6. CLIENTS — CLIENT DETAIL (/clients/:id)


| #    | Feature                                          | DIR | DEP | ADV | SP  | Comment |
| ---- | ------------------------------------------------ | --- | --- | --- | --- | ------- |
| 6.1  | Breadcrumbs: Clients → Company name              | ✅   | ✅   | ✅   | ✅   |         |
| 6.2  | Breadcrumb preserves search params               | ✅   | ✅   | ✅   | ✅   |         |
| 6.3  | Basic info displayed                             | ✅   | ✅   | ✅   | ✅   |         |
| 6.4  | Edit basic info                                  | ✅   | ✅   | ✅   | ✅   |         |
| 6.5  | Addresses displayed                              | ✅   | ✅   | ✅   | ✅   |         |
| 6.6  | Add address — postal code auto-format            | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 6.7  | Add/edit address                                 | ✅   | ✅   | ✅   | ✅   |         |
| 6.8  | Delete address — confirm dialog                  | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 6.9  | Delete address — brak przycisku gdy 1 adres      | ✅   | ✅   | ✅   | ✅   |         |
| 6.10 | Add/edit/delete contact                          | ✅   | ✅   | ✅   | ✅   |         |
| 6.11 | Delete contact — confirm dialog                  | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 6.12 | Assignment section — ADV widzi salesperson       | 🔲  | N/A | 🔲  | N/A | ✅       |
| 6.13 | Assignment section — DEP: sales + adv + region   | ✅   | ✅   | N/A | N/A |         |
| 6.14 | Assignment section — DIR: wszystko + superregion | ✅   | N/A | N/A | N/A |         |
| 6.15 | Salesperson link → /users/:id (ADV też widzi)    | 🔲  | 🔲  | 🔲  | N/A | ✅       |
| 6.16 | Advisor link → /users/:id                        | ✅   | ✅   | N/A | N/A |         |
| 6.17 | Change salesperson assignment                    | ✅   | ✅   | N/A | N/A |         |
| 6.18 | Notes — add/edit/delete own                      | ✅   | ✅   | ✅   | ✅   |         |
| 6.19 | Notes — DIR usuwa/edytuje każdą notatkę          | 🔲  | N/A | N/A | N/A | ✅       |
| 6.20 | Notes — DEP usuwa/edytuje notatki ADV/SP         | 🔲  | 🔲  | N/A | N/A | ✅       |
| 6.21 | Notes — ADV/SP nie mogą edytować cudzych         | N/A | N/A | ✅   | ✅   |         |
| 6.22 | Sekcja inactivity reason USUNIĘTA                | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 6.23 | Others: created at, last updated                 | ✅   | ✅   | ✅   | ✅   |         |


---

## 7. CLIENTS — ARCHIVE ACTIONS


| #    | Feature                                          | DIR | DEP | ADV | SP  | Comment |
| ---- | ------------------------------------------------ | --- | --- | --- | --- | ------- |
| 7.1  | SP widzi "Request archive"                       | N/A | N/A | N/A | ✅   |         |
| 7.2  | DEP widzi "Request archive"                      | N/A | ✅   | N/A | N/A |         |
| 7.3  | ADV nie widzi archive actions                    | N/A | N/A | ✅   | N/A |         |
| 7.4  | DIR widzi "Archive" (direct)                     | ✅   | N/A | N/A | N/A |         |
| 7.5  | Request archive — reason required                | N/A | ✅   | N/A | ✅   |         |
| 7.6  | Request archive — notification do ADV/DEP/DIR    | N/A | ✅   | N/A | ✅   |         |
| 7.7  | "Request archive" disabled jeśli już zgłoszono   | N/A | ✅   | N/A | ✅   |         |
| 7.8  | "Request archive" NIE jest disabled po unarchive | 🔲  | 🔲  | N/A | 🔲  | ✅       |
| 7.9  | Direct archive — reason required                 | ✅   | N/A | N/A | N/A |         |
| 7.10 | Direct archive — klient trafia do archiwum       | ✅   | N/A | N/A | N/A |         |


---

## 8. CALENDAR (/calendar)


| #    | Feature                                                    | DIR | DEP | ADV | SP  | Comment |
| ---- | ---------------------------------------------------------- | --- | --- | --- | --- | ------- |
| 8.1  | Calendar loads                                             | ✅   | ✅   | ✅   | ✅   |         |
| 8.2  | Month/week/agenda switching                                | ✅   | ✅   | ✅   | ✅   |         |
| 8.3  | Own/invited/mandatory events — różne kolory                | ✅   | ✅   | ✅   | ✅   |         |
| 8.4  | Create personal event                                      | ✅   | ✅   | ✅   | ✅   |         |
| 8.5  | Create client meeting                                      | ✅   | ✅   | ✅   | ✅   |         |
| 8.6  | Create team meeting — invite participants                  | ✅   | ✅   | ✅   | ✅   |         |
| 8.7  | InviteUsers — ukrywa userów bez pozycji i zarchiwizowanych | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.8  | Create mandatory event (DIR/DEP only)                      | ✅   | ✅   | N/A | N/A |         |
| 8.9  | ADV/SP nie mogą tworzyć mandatory                          | N/A | N/A | ✅   | ✅   |         |
| 8.10 | Edit own event                                             | ✅   | ✅   | ✅   | ✅   |         |
| 8.11 | Cannot edit other user's event                             | ✅   | ✅   | ✅   | ✅   |         |
| 8.12 | Delete own event                                           | ✅   | ✅   | ✅   | ✅   |         |
| 8.13 | Drag & drop reschedule                                     | ✅   | ✅   | ✅   | ✅   |         |
| 8.14 | Conflict detection on create → toast                       | ✅   | ✅   | ✅   | ✅   |         |
| 8.15 | Conflict detection on edit/drag → toast                    | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.16 | Copy event — kopiuje też listę zaproszonych                | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.17 | Accept invitation — sprawdza konflikty                     | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.18 | Zmiana odpowiedzi na zaproszenie (accept↔reject)           | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.19 | Zmiana odpowiedzi → notification dla twórcy                | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.20 | Zmiany w evencie → notification do zaproszonych            | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 8.21 | Cannot respond to mandatory event                          | ✅   | ✅   | ✅   | ✅   |         |
| 8.22 | Day view modal                                             | ✅   | ✅   | ✅   | ✅   |         |
| 8.23 | Event detail modal                                         | ✅   | ✅   | ✅   | ✅   |         |


---

## 9. NOTIFICATIONS


| #    | Feature                                                       | DIR | DEP | ADV | SP  | Comment |
| ---- | ------------------------------------------------------------- | --- | --- | --- | --- | ------- |
| 9.1  | List shows own notifications                                  | ✅   | ✅   | ✅   | ✅   |         |
| 9.2  | Unread highlighted                                            | ✅   | ✅   | ✅   | ✅   |         |
| 9.3  | Mark read/unread                                              | ✅   | ✅   | ✅   | ✅   |         |
| 9.4  | Delete notification                                           | ✅   | ✅   | ✅   | ✅   |         |
| 9.5  | Detail modal                                                  | ✅   | ✅   | ✅   | ✅   |         |
| 9.6  | Link do powiązanego klienta                                   | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 9.7  | Link do powiązanego eventu                                    | ✅   | ✅   | ✅   | ✅   |         |
| 9.8  | Archive request/approved/rejected notification                | ✅   | ✅   | ✅   | ✅   |         |
| 9.9  | Event invitation notification                                 | ✅   | ✅   | ✅   | ✅   |         |
| 9.10 | Event conflict notification przy tworzeniu                    | ✅   | ✅   | ✅   | ✅   |         |
| 9.11 | Event conflict notification przy akceptacji                   | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 9.12 | Notification o zmianie w evencie                              | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 9.13 | Notification o zmianie odpowiedzi na zaproszenie (dla twórcy) | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |


---

## 10. COMPANY — STRUCTURE (/company)


| #    | Feature                           | DIR | DEP | ADV | SP  | Comment |
| ---- | --------------------------------- | --- | --- | --- | --- | ------- |
| 10.1 | Page loads                        | ✅   | ✅   | ✅   | ✅   |         |
| 10.2 | Full hierarchy displayed          | ✅   | ✅   | ✅   | ✅   |         |
| 10.3 | Vacant positions as "Vacant"      | ✅   | ✅   | ✅   | ✅   |         |
| 10.4 | Superregion collapse/expand       | ✅   | ✅   | ✅   | ✅   |         |
| 10.5 | Region collapse/expand z animacją | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 10.6 | Search by name / code             | ✅   | ✅   | ✅   | ✅   |         |
| 10.7 | Click user → /users/:id           | ✅   | ✅   | ✅   | ✅   |         |
| 10.8 | Documents tab placeholder         | ✅   | ✅   | ✅   | ✅   |         |


---

## 11. USER DETAIL PAGE (/users/:id)


| #     | Feature                                                      | DIR | DEP | ADV | SP  | Comment |
| ----- | ------------------------------------------------------------ | --- | --- | --- | --- | ------- |
| 11.1  | Breadcrumbs: Company → User name                             | ✅   | ✅   | ✅   | ✅   |         |
| 11.2  | Avatar (profile lub placeholder)                             | ✅   | ✅   | ✅   | ✅   |         |
| 11.3  | Avatar / workplace / about aktualizuje się bez przeładowania | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 11.4  | Contact: phone / email                                       | ✅   | ✅   | ✅   | ✅   |         |
| 11.5  | Position: role, code, grade, region, superregion             | ✅   | ✅   | ✅   | ✅   |         |
| 11.6  | Employment: hired at, workplace, last login                  | ✅   | ✅   | ✅   | ✅   |         |
| 11.7  | About section                                                | ✅   | ✅   | ✅   | ✅   |         |
| 11.8  | Notes visible dla DIR/DEP only                               | ✅   | ✅   | N/A | N/A |         |
| 11.9  | Notes NOT visible dla ADV/SP                                 | N/A | N/A | ✅   | ✅   |         |
| 11.10 | Position history visible dla DIR/DEP only                    | ✅   | ✅   | N/A | N/A |         |
| 11.11 | Position history: assignedAt → removedAt                     | 🔲  | 🔲  | N/A | N/A | ✅       |
| 11.12 | Position history NOT visible dla ADV/SP                      | N/A | N/A | ✅   | ✅   |         |


---

## 12. SETTINGS (/settings)


| #     | Feature                                  | DIR | DEP | ADV | SP  | Comment    |
| ----- | ---------------------------------------- | --- | --- | --- | --- | ---------- |
| 12.1  | Page loads                               | ✅   | ✅   | ✅   | ✅   |            |
| 12.2  | Avatar upload (max 1MB)                  | ✅   | ✅   | ✅   | ✅   |            |
| 12.3  | Avatar > 1MB → toast (nie browser alert) | 🔲  | 🔲  | 🔲  | 🔲  | ✅          |
| 12.4  | Avatar preview immediate                 | ✅   | ✅   | ✅   | ✅   |            |
| 12.5  | Workplace / description saves            | ✅   | ✅   | ✅   | ✅   |            |
| 12.6  | Save disabled gdy brak zmian             | ✅   | ✅   | ✅   | ✅   |            |
| 12.7  | Save success → toast                     | 🔲  | 🔲  | 🔲  | 🔲  | ✅          |
| 12.8  | Opuszczenie z niezapisanymi → confirm    | 🔲  | 🔲  | 🔲  | 🔲  | NAPRAWIONE |
| 12.9  | Change password — valid                  | ✅   | ✅   | ✅   | ✅   |            |
| 12.10 | Change password — wrong current → error  | ✅   | ✅   | ✅   | ✅   |            |
| 12.11 | Change password — mismatch → error       | ✅   | ✅   | ✅   | ✅   |            |
| 12.12 | Email / member since / last login        | ✅   | ✅   | ✅   | ✅   |            |


---

## 13. MANAGEMENT — STRUCTURE


| #     | Feature                                          | DIR | DEP | ADV | SP  | Comment    |
| ----- | ------------------------------------------------ | --- | --- | --- | --- | ---------- |
| 13.1  | Page accessible                                  | ✅   | ✅   | N/A | N/A |            |
| 13.2  | DIR sees all / DEP sees own                      | ✅   | ✅   | N/A | N/A |            |
| 13.3  | Search by name / code                            | ✅   | ✅   | N/A | N/A |            |
| 13.4  | Edit superregion name (DIR only)                 | ✅   | N/A | N/A | N/A |            |
| 13.5  | Change deputy — confirm jeśli pozycja zajęta     | 🔲  | N/A | N/A | N/A | ✅          |
| 13.6  | Change deputy — lista: tylko aktywni bez pozycji | 🔲  | N/A | N/A | N/A | ✅          |
| 13.7  | Change deputy — rola → deputy, grade usuwany     | 🔲  | N/A | N/A | N/A | ✅          |
| 13.8  | Remove deputy — confirm                          | ✅   | N/A | N/A | N/A |            |
| 13.9  | Edit region name                                 | ✅   | ✅   | N/A | N/A |            |
| 13.10 | Edit region prefix                               | 🔲  | 🔲  | N/A | N/A | ✅          |
| 13.11 | Move region (DIR only)                           | ✅   | N/A | N/A | N/A |            |
| 13.12 | Add position                                     | ✅   | ✅   | N/A | N/A |            |
| 13.13 | Remove vacant position                           | ✅   | ✅   | N/A | N/A |            |
| 13.14 | Remove occupied → blocked                        | ✅   | ✅   | N/A | N/A |            |
| 13.15 | Remove position z klientami → blocked            | ✅   | ✅   | N/A | N/A |            |
| 13.16 | Edit position code — w ManagePosition modal      | 🔲  | 🔲  | N/A | N/A | NAPRAWIONE |
| 13.17 | Assign user to position                          | ✅   | ✅   | N/A | N/A |            |
| 13.18 | Remove user from position (keep active)          | ✅   | ✅   | N/A | N/A |            |
| 13.19 | Archive user — reason required                   | ✅   | ✅   | N/A | N/A |            |
| 13.20 | Archive user — auto-refresh struktury            | 🔲  | 🔲  | N/A | N/A | NAPRAWIONE |
| 13.21 | Move user — auto-refresh                         | 🔲  | 🔲  | N/A | N/A | NAPRAWIONE |
| 13.22 | DEP nie może przenieść poza własny superregion   | N/A | ✅   | N/A | N/A |            |
| 13.23 | Click user → EditUserModal                       | ✅   | ✅   | N/A | N/A |            |
| 13.24 | EditUserModal — przycisk archive                 | 🔲  | 🔲  | N/A | N/A | ✅          |


---

## 14. MANAGEMENT — USERS


| #     | Feature                                               | DIR | DEP | ADV | SP  | Comment    |
| ----- | ----------------------------------------------------- | --- | --- | --- | --- | ---------- |
| 14.1  | Only active users                                     | ✅   | ✅   | N/A | N/A |            |
| 14.2  | DIR all / DEP own superregion                         | ✅   | ✅   | N/A | N/A |            |
| 14.3  | Search by name (nie email)                            | 🔲  | 🔲  | N/A | N/A | ✅          |
| 14.4  | Pagination                                            | ✅   | ✅   | N/A | N/A |            |
| 14.5  | Click user → EditUserModal                            | ✅   | ✅   | N/A | N/A |            |
| 14.6  | EditUserModal — name / email / phone (z walidacją)    | 🔲  | 🔲  | N/A | N/A | ✅          |
| 14.7  | EditUserModal — grade dla ADV/SP                      | ✅   | ✅   | N/A | N/A |            |
| 14.8  | EditUserModal — reset password (temp + flaga)         | 🔲  | 🔲  | N/A | N/A | ✅          |
| 14.9  | EditUserModal — notes (add/delete z confirmem)        | 🔲  | 🔲  | N/A | N/A | NAPRAWIONE |
| 14.10 | EditUserModal — archive button                        | 🔲  | 🔲  | N/A | N/A | ✅          |
| 14.11 | Create user — required fields z walidacją tel         | 🔲  | 🔲  | N/A | N/A | ✅          |
| 14.12 | Create user — DEP widzi tylko własne vacant positions | 🔲  | 🔲  | N/A | N/A | ✅          |
| 14.13 | Create user — confirm przy submit i cancel            | 🔲  | 🔲  | N/A | N/A | NAPRAWIONE |
| 14.14 | Create user — duplicate email → error                 | ✅   | ✅   | N/A | N/A |            |


---

## 15. MANAGEMENT — REGIONS


| #    | Feature                                        | DIR | DEP | ADV | SP  | Comment |
| ---- | ---------------------------------------------- | --- | --- | --- | --- | ------- |
| 15.1 | Tab loads                                      | ✅   | ✅   | N/A | N/A |         |
| 15.2 | DIR all / DEP own                              | ✅   | ✅   | N/A | N/A |         |
| 15.3 | Create region — superregion required           | 🔲  | 🔲  | N/A | N/A | ✅       |
| 15.4 | Create region — DEP locked do własnego SR      | N/A | ✅   | N/A | N/A |         |
| 15.5 | Create superregion (DIR only)                  | ✅   | N/A | N/A | N/A |         |
| 15.6 | Duplicate name → error                         | ✅   | ✅   | N/A | N/A |         |
| 15.7 | Delete region — visible jeśli brak pracowników | 🔲  | 🔲  | N/A | N/A | ✅       |
| 15.8 | Delete region — blocked jeśli są pracownicy    | 🔲  | 🔲  | N/A | N/A | ✅       |
| 15.9 | Delete region — confirm dialog                 | 🔲  | 🔲  | N/A | N/A | ✅       |


---

## 16. ARCHIVE — CLIENTS (/archive)


| #    | Feature                                         | DIR | DEP | ADV | SP  | Comment |
| ---- | ----------------------------------------------- | --- | --- | --- | --- | ------- |
| 16.1 | Accessible DIR only                             | ✅   | N/A | N/A | N/A |         |
| 16.2 | Breadcrumbs: Archive → Company name             | 🔲  | N/A | N/A | N/A | ✅       |
| 16.3 | Search / filter / sort / pagination             | ✅   | N/A | N/A | N/A |         |
| 16.4 | Click → /clients/:id                            | ✅   | N/A | N/A | N/A |         |
| 16.5 | Unarchive — reason required                     | ✅   | N/A | N/A | N/A |         |
| 16.6 | Unarchive — client active, archiveRequest reset | 🔲  | N/A | N/A | N/A | ✅       |
| 16.7 | Unarchive — notification do salesperson         | ✅   | N/A | N/A | N/A |         |


---

## 17. ARCHIVE — EMPLOYEES (/archive)


| #    | Feature                                 | DIR | DEP | ADV | SP  | Comment    |
| ---- | --------------------------------------- | --- | --- | --- | --- | ---------- |
| 17.1 | Breadcrumbs: Archive → User name        | 🔲  | N/A | N/A | N/A | NAPRAWIONE |
| 17.2 | Search / sort / pagination              | ✅   | N/A | N/A | N/A |            |
| 17.3 | Last position / reason / date displayed | ✅   | N/A | N/A | N/A |            |
| 17.4 | Click → /users/:id                      | ✅   | N/A | N/A | N/A |            |
| 17.5 | Unarchive user (DO ZROBIENIA)           | 💬  | N/A | N/A | N/A | ✅          |


---

## 18. EDGE CASES


| #     | Feature                                     | DIR | DEP | ADV | SP  | Comment |
| ----- | ------------------------------------------- | --- | --- | --- | --- | ------- |
| 18.1  | Vacant position everywhere                  | ✅   | ✅   | ✅   | ✅   |         |
| 18.2  | Archived user NOT in structure / management | ✅   | ✅   | ✅   | ✅   |         |
| 18.3  | Position history updated on assign/remove   | ✅   | ✅   | N/A | N/A |         |
| 18.4  | Grade usuwany przy awansie na deputy        | 🔲  | N/A | N/A | N/A | ✅       |
| 18.5  | Role updated przy zmianie pozycji           | ✅   | ✅   | N/A | N/A |         |
| 18.6  | Toast on success / error                    | ✅   | ✅   | ✅   | ✅   |         |
| 18.7  | Loader during fetch                         | 🔲  | 🔲  | 🔲  | 🔲  | ✅       |
| 18.8  | FetchError on API failure                   | ✅   | ✅   | ✅   | ✅   |         |
| 18.9  | Modal: brak close on outside click          | ✅   | ✅   | ✅   | ✅   |         |
| 18.10 | Modal: Escape closes                        | ✅   | ✅   | ✅   | ✅   |         |
| 18.11 | Dates en-GB format                          | ✅   | ✅   | ✅   | ✅   |         |
| 18.12 | Mobile 375px responsive                     | ✅   | ✅   | ✅   | ✅   |         |
| 18.13 | Last login updates po logowaniu             | ✅   | ✅   | ✅   | ✅   |         |
