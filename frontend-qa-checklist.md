# Frontend QA Checklist — Seller CRM

**Role:** Director (DIR) | Deputy (DEP) | Advisor (ADV) | Salesperson (SP)  
**Status:** ✅ Works | ❌ Broken | ⚠️ Partial | 🔲 Not tested | 💬 Comment

---

## 1. AUTH


| #    | Feature                                                   | DIR | DEP | ADV | SP  | Comment                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | --------------------------------------------------------- | --- | --- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Login with valid credentials                              | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.2  | Login with invalid password → error message               | `✅` | `✅` | `✅` | `✅` | Red Toast: Invalid credentials                                                                                                                                                                                                                                                                                                                                                  |
| 1.3  | Login with non-existent email → error message             | `✅` | `✅` | `✅` | `✅` | Red Toast: Invalid credentials                                                                                                                                                                                                                                                                                                                                                  |
| 1.4  | Redirect to /change-password when mustChangePassword=true | 🔲  | 🔲  | `✅` | `✅` | na potrzeby testów seed tworzy director i deputy bez flagi must change. Trzeba dodać do modala "Edit User" moliwość zmiany hasła uytkownikowi (temp password) i zeby zmieniało flagę mustChangePassword                                                                                                                                                                         |
| 1.5  | Force password change — valid submission                  | 🔲  | 🔲  | `✅` | `✅` | sprawdzanie poprawności current password jest na submit, a matchowania nowego hasła na poziomie formularza - trzeba to ujednolicić i zrobić na posiomie wpisywania                                                                                                                                                                                                              |
| 1.6  | Force password change — passwords don't match → error     | 🔲  | 🔲  | `✅` | `✅` | "Password must be at least 8 characters" i "Passwords do not match" wyświetla się juz po wpisaniu pierwszych liter - niech sprawdza dopiero na blurze                                                                                                                                                                                                                           |
| 1.7  | After password change redirect to /                       | 🔲  | 🔲  | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.8  | Logout clears session and redirects to /login             | `✅` | `✅` | `✅` | `✅` | po logout w local storage jest {"state":{"token":null,"user":null},"version":0}. Po zamknięciu zakładki przeglądarki, skopiowaniu linku i wklejeniu w innej zakładce uytkownik dalej jest zalogowany - jeśli się da, trzeba to zawęzić do jednej zakładki, ale umozliwić dwie sesje jednoczesie w dwóch róznych zakladkach: 1 zakladka - 1 logowanie, 2 zakładka - 2 logowanie. |
| 1.9  | Session timeout warning modal appears                     | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.10 | Session timeout auto-logout                               | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.11 | Accessing protected route without token → redirect /login | N/A | `✅` | `✅` | `✅` | director nie ma protected                                                                                                                                                                                                                                                                                                                                                       |
| 1.12 | Accessing /management as ADV/SP → redirect /              | N/A | N/A | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.13 | Accessing /archive as DEP/ADV/SP → redirect /             | N/A | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                 |


---

## 2. NAVIGATION & LAYOUT


| #   | Feature                               | DIR | DEP | ADV | SP  | Comment                                                                                                                   |
| --- | ------------------------------------- | --- | --- | --- | --- | ------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Sidebar shows correct links per role  | `✅` | `✅` | `✅` | `✅` | DIR: all, DEP: no archive, ADV/SP: Dashboard/Clients/Company/Settings Sidebar prawidłowo wyświetla się na mobile i tablet |
| 2.2 | Active link highlighted in sidebar    | `✅` | `✅` | `✅` | `✅` |                                                                                                                           |
| 2.3 | Topbar shows user name and avatar     | ⚠️  | ⚠️  | ⚠️  | ⚠️  | test źle napisany - topbar wyświetla name i role, tak jak było zamierzone                                                 |
| 2.4 | Topbar scrolled state changes style   | `✅` | `✅` | `✅` | `✅` |                                                                                                                           |
| 2.5 | Notifications bell shows unread count | 🔲  | 🔲  | 🔲  | 🔲  | jaki notification bell? nie ma zadnego notification bell poza tym w segmencie Notifications na dashboardzie               |
| 2.6 | 404 page shown for unknown routes     | `✅` | `✅` | `✅` | `✅` | na koniec prac trzeba dopracować stronę not foud, zeby stylistycznie pasowała do reszty layoutu                           |
| 2.7 | Page transitions animate correctly    | `✅` | `✅` | `✅` | `✅` |                                                                                                                           |
| 2.8 | Mobile sidebar toggles correctly      | `✅` | `✅` | `✅` | `✅` |                                                                                                                           |


---

## 3. DASHBOARD


| #   | Feature                            | DIR | DEP | ADV | SP  | Comment                                   |
| --- | ---------------------------------- | --- | --- | --- | --- | ----------------------------------------- |
| 3.1 | Dashboard page loads without error | `✅` | `✅` | `✅` | `✅` | a gdzie testy kalendarza i notifications? |


---

## 4. CLIENTS — LIST (/clients)


| #    | Feature                                             | DIR | DEP | ADV | SP  | Comment                                                                                             |
| ---- | --------------------------------------------------- | --- | --- | --- | --- | --------------------------------------------------------------------------------------------------- |
| 4.1  | DIR sees all clients                                | `✅` | N/A | N/A | N/A |                                                                                                     |
| 4.2  | DEP sees clients in own superregion only            | N/A | `✅` | N/A | N/A |                                                                                                     |
| 4.3  | ADV sees clients in own region only                 | N/A | N/A | `✅` | N/A |                                                                                                     |
| 4.4  | SP sees own clients + colleagues' names (read-only) | N/A | N/A | N/A | `✅` | + colleagues' names (read-only) <-- ?? na liście klientów widzi tylko swoich klientów, jak powinien |
| 4.5  | Search by company name works                        | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.6  | Search by NIP works                                 | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.7  | Search by city works                                | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.8  | Filter by salesperson works                         | `✅` | `✅` | `✅` | N/A | SP has no salesperson filter                                                                        |
| 4.9  | Filter by region works                              | `✅` | `✅` | N/A | N/A |                                                                                                     |
| 4.10 | Filter by superregion works                         | `✅` | N/A | N/A | N/A |                                                                                                     |
| 4.11 | Sort by ID                                          | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.12 | Sort by company name                                | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.13 | Sort by last activity                               | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.14 | Pagination — rows per page (10/20)                  | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.15 | Pagination — page navigation works                  | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.16 | Click company name → navigate to /clients/:id       | `✅` | `✅` | `✅` | `✅` |                                                                                                     |
| 4.17 | Add client button visible                           | `✅` | `✅` | `✅` | `✅` |                                                                                                     |


---

## 5. CLIENTS — ADD CLIENT MODAL


| #   | Feature                                                      | DIR | DEP | ADV | SP  | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------ | --- | --- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Add client modal opens                                       | 🔲  | 🔲  | `✅` | `✅` |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5.2 | Required fields validation (company name, address)           | ⚠️  | ⚠️  | ⚠️  | `✅` | Sp: comp name, nip, all fields in address and contact `✅` reszta: bez wybranego salespersona toast: **Something went wrong. Please try again. <--Toast powinien być bardziej specyficzny w tym przypadku albo walidacja na select salesperson, a nie przez toast**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 5.3 | NIP duplicate check works                                    | ❌   | ❌   | ❌   | ❌   | Ogólnie powinno to działać na takiej zasadzie: kilku handlowców moe mieć przypisanego tego samego klienta, dlatego NIP moze się powtarzać, ale tutaj 1 handlowiec moze mieć dwóch klientów o tym samym NIPie - tak to nie moze działać. Niech sprawdza, czy dany handlowiec ma klienta o takim NIPie. Dodatkowo jest sprawdzanie w archiwum -> tu tez trzeba sprawdzać, czy klient przed zarchiwizowaniem nalezał do danego handlowca -> jeśli tak, to wtedy unarchive request, jeśli nie - klient normalnie się dodaje u danego handlowca, a w archiwum jest u innego handlowca. Walidowanie NIPU powinno odbywać się na blurze z inputa, zeby pracownik nie musiał wprowadzić wszystkich danych a na koniec okazuje się, e klient i tak jest ju w systemie |
| 5.4 | SP creates client — auto-assigned to own position            | N/A | N/A | N/A | `✅` |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5.5 | ADV creates client — can assign to salesperson in own region | N/A | N/A | `✅` | N/A |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5.6 | DIR creates client — can assign to any salesperson           | `✅` | N/A | N/A | N/A |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5.7 | Add address with contacts works                              | 🔲  | 🔲  | 🔲  | `✅` |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5.8 | Cancel with unsaved changes → confirm dialog                 | 🔲  | 🔲  | 🔲  | `✅` |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |


---

## 6. CLIENTS — CLIENT DETAIL (/clients/:id)


| #    | Feature                                               | DIR | DEP | ADV | SP  | Comment                                                                                                                      |
| ---- | ----------------------------------------------------- | --- | --- | --- | --- | ---------------------------------------------------------------------------------------------------------------------------- |
| 6.1  | Breadcrumbs show Clients → Company name               | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.2  | Breadcrumb back link preserves search params          | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.3  | Client basic info displayed (name, ID, NIP)           | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.4  | Edit basic info (name, NIP) works                     | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.5  | Addresses section displayed                           | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.6  | Add address works                                     | `✅` | `✅` | `✅` | `✅` | przy postal code warto dodać zeby po dwóch znakach "-" pojawiał się automatycznie                                            |
| 6.7  | Edit address works                                    | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.8  | Delete address works (not last one)                   | `✅` | `✅` | `✅` | `✅` | nie pojawia się w ogóle przycisk do kasowania adresu, jeśli jest tlyko 1, taze error nie ma jak się wyswietlić dodać confirm |
| 6.10 | Add contact to address works                          | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.11 | Edit contact works                                    | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.12 | Delete contact works                                  | `✅` | `✅` | `✅` | `✅` | dodać confirm                                                                                                                |
| 6.13 | Assignment section visible for DEP and DIR only       | `✅` | `✅` | ⚠️  | N/A | dir - sales, adv, region, superregion, dep - bez superregion, advisor powinien widzieć salesperson                           |
| 6.14 | Superregion shown for DIR only                        | `✅` | N/A | N/A | N/A |                                                                                                                              |
| 6.15 | Salesperson link → navigates to /users/:id            | `✅` | `✅` | ⚠️  | N/A | dla advisora tez powinien byc dostepny                                                                                       |
| 6.16 | Advisor link → navigates to /users/:id                | `✅` | `✅` | N/A | N/A |                                                                                                                              |
| 6.17 | Change salesperson assignment works                   | `✅` | `✅` | N/A | N/A | dla deputy równiez działa, tylko we wlasnym superregionie - poprawne dzialanie                                               |
| 6.18 | Notes section — add note works                        | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.19 | Notes — edit own note works                           | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.20 | Notes — delete own note works                         | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.21 | Notes — DIR can delete any note                       | ❌   | N/A | N/A | N/A | brak mozliwości usuwania/.edytowania notatek stworzonych przez innych przez dir                                              |
| 6.22 | Notes — cannot edit/delete other user's note (ADV/SP) | N/A | ⚠️  | `✅` | `✅` | deputy rowniez nie moze edytowac/usuwac innych notatek - powinien móc to robić notatkom adv/sales                            |
| 6.23 | Others section — created at, last updated displayed   | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 6.24 | Inactivity reason shown when applicable               | 🔲  | 🔲  | 🔲  | 🔲  | sekcja inactivity całkowicie do usunięcia - inne rozwiązanie architektoniczne                                                |


---

## 7. CLIENTS — ARCHIVE ACTIONS


| #   | Feature                                                | DIR | DEP | ADV | SP  | Comment                                                                                                                             |
| --- | ------------------------------------------------------ | --- | --- | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | SP sees "Request archive" in actions dropdown          | N/A | N/A | N/A | ⚠️  | klienci, którzy zostali wyciagnieci z archiwum (unarchived) - ponowny request o archive jest disabled - jakby flaga nie była zdjęta |
| 7.2 | DEP sees "Request archive" in actions dropdown         | N/A | `✅` | N/A | N/A |                                                                                                                                     |
| 7.3 | ADV sees no archive actions                            | N/A | N/A | `✅` | N/A |                                                                                                                                     |
| 7.4 | DIR sees "Archive" (direct) in actions dropdown        | `✅` | N/A | N/A | N/A |                                                                                                                                     |
| 7.5 | Request archive modal — reason required                | N/A | `✅` | N/A | `✅` |                                                                                                                                     |
| 7.6 | Request archive sends notification to ADV/DEP/DIR      | N/A | `✅` | N/A | `✅` |                                                                                                                                     |
| 7.7 | "Request archive" button disabled if already requested | N/A | `✅` | N/A | `✅` |                                                                                                                                     |
| 7.8 | Direct archive (DIR) — reason required                 | `✅` | N/A | N/A | N/A |                                                                                                                                     |
| 7.9 | Direct archive moves client to archive                 | `✅` | N/A | N/A | N/A |                                                                                                                                     |


---

## 8. CALENDAR (/calendar — via Dashboard)


| #    | Feature                                         | DIR | DEP | ADV | SP  | Comment                           |
| ---- | ----------------------------------------------- | --- | --- | --- | --- | --------------------------------- |
| 8.1  | Calendar loads and shows events                 | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.2  | Month/week/agenda view switching                | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.3  | Own events visible (own color)                  | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.4  | Invited events visible (different color)        | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.5  | Mandatory events visible                        | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.6  | Create personal event works                     | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.7  | Create client meeting — client search works     | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.8  | Create team meeting — invite participants works | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.9  | Create mandatory event (DIR/DEP only)           | `✅` | `✅` | N/A | N/A |                                   |
| 8.10 | SP cannot create mandatory event                | N/A | N/A | `✅` | `✅` | advisor równiez - poprane         |
| 8.11 | Edit own event works                            | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.12 | Cannot edit other user's event                  | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.13 | Delete own event works                          | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.14 | Drag & drop reschedule own event                | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.15 | Conflict detection on create                    | `✅` | `✅` | `✅` | `✅` | toast                             |
| 8.16 | Conflict detection on edit/drag                 | ❌   | ❌   | ❌   | ❌   | brak jakiegokolwiek powiadomienia |
| 8.17 | Accept invitation works                         | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.18 | Reject invitation works                         | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.19 | Cannot respond to mandatory event               | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.20 | Day view modal opens on day click               | `✅` | `✅` | `✅` | `✅` |                                   |
| 8.21 | Event detail modal shows full info              | `✅` | `✅` | `✅` | `✅` |                                   |


---

## 9. NOTIFICATIONS


| #    | Feature                                    | DIR | DEP | ADV | SP  | Comment                                                                                                                      |
| ---- | ------------------------------------------ | --- | --- | --- | --- | ---------------------------------------------------------------------------------------------------------------------------- |
| 9.1  | Notifications list shows own notifications | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.2  | Unread notifications highlighted           | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.3  | Mark as read works                         | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.4  | Mark as unread works                       | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.5  | Delete notification works                  | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.6  | Notification detail modal opens            | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.7  | Notification links to related client       | ❌   | ❌   | ❌   | ❌   | brak informacji o kliencie w powiadomieniu                                                                                   |
| 9.8  | Notification links to related event        | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.9  | Archive request notification received      | `✅` | `✅` | `✅` | `✅` | w zaleznosci, czy dep czy sales zglasza request - ten drugi widzi powiadomienie                                              |
| 9.10 | Archive approved notification received     | N/A | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.11 | Archive rejected notification received     | N/A | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.12 | Event invitation notification received     | `✅` | `✅` | `✅` | `✅` |                                                                                                                              |
| 9.13 | Event conflict notification received       | ❌   | ❌   | ❌   | ❌   | bark notifications o jakichkolwiek konfliktach - jedyny komunikat o konflikcie występuje w momencie tworzenia eventu (toast) |


---

## 10. COMPANY — STRUCTURE (/company)


| #    | Feature                                             | DIR | DEP | ADV | SP  | Comment                                 |
| ---- | --------------------------------------------------- | --- | --- | --- | --- | --------------------------------------- |
| 10.1 | Company page loads with Structure tab               | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.2 | Full hierarchy displayed (DIR → SR → R → positions) | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.3 | Vacant positions shown as "Vacant"                  | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.4 | Superregion collapse/expand works                   | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.5 | Region collapse/expand works                        | `✅` | `✅` | `✅` | `✅` | mozna dodać animację zwjania/rozwijania |
| 10.6 | Search by name works                                | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.7 | Search by position code works                       | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.8 | Click on user name → navigate to /users/:id         | `✅` | `✅` | `✅` | `✅` |                                         |
| 10.9 | Documents tab shows placeholder                     | `✅` | `✅` | `✅` | `✅` |                                         |


---

## 11. USER DETAIL PAGE (/users/:id)


| #     | Feature                                                  | DIR | DEP | ADV | SP  | Comment                                                                                                                                                                                                                                                   |
| ----- | -------------------------------------------------------- | --- | --- | --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.1  | Breadcrumbs: Company → User name                         | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.2  | Avatar displayed (profile or placeholder)                | ⚠️  | ⚠️  | ⚠️  | ⚠️  | po zmianie avatara trzeba odświezyć na stronie users/:id, zeby się zaktualizował - podobnie workplace i about. Sprawdzić jaki jest stale time - te dane nie są jakieś super wazne ze muszą być mega aktualne co chwilę Placeholder się pokazuje elegancko |
| 11.3  | Contact section: phone (tel: link)                       | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.4  | Contact section: email (mailto: link)                    | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.5  | Position section: role, code, grade, region, superregion | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.6  | Employment: hired at, workplace, last login              | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.7  | About section displays description                       | `✅` | `✅` | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.8  | Notes section visible for DIR/DEP only                   | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                                                                           |
| 11.9  | Notes section NOT visible for ADV/SP                     | N/A | N/A | `✅` | `✅` |                                                                                                                                                                                                                                                           |
| 11.10 | Position history visible for DIR/DEP only                | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                                                                           |
| 11.11 | Position history shows assignedAt → removedAt            | ⚠️  | ⚠️  | N/A | N/A | przy danych z seeda nie pokazuje się historia - sprawdzić, czy to wina seeda, bo przypisanie danych do nowego stanowiska od pierwszego zatrudnionego pokazuje historię.                                                                                   |
| 11.12 | Position history NOT visible for ADV/SP                  | N/A | N/A | `✅` | `✅` |                                                                                                                                                                                                                                                           |


---

## 12. SETTINGS (/settings)


| #     | Feature                                          | DIR | DEP | ADV | SP  | Comment                                                                             |
| ----- | ------------------------------------------------ | --- | --- | --- | --- | ----------------------------------------------------------------------------------- |
| 12.1  | Settings page loads                              | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.2  | Avatar upload (max 1MB) works                    | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.3  | Avatar > 1MB → error message                     | ⚠️  | ⚠️  | ⚠️  | ⚠️  | powyzej 1mb pojawia się przydki alert przegladarkowy - wykorzystajmy toasta         |
| 12.4  | Avatar preview updates immediately               | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.5  | Workplace field saves correctly                  | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.6  | About/description field saves correctly          | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.7  | Save button disabled when no changes             | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.8  | Save success toast appears                       | ❌   | ❌   | ❌   | ❌   | przy niezatwierdzonych zmianach równiez nie ma zadnego ostrzeenia opuszczajac trone |
| 12.9  | Change password — valid submission works         | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.10 | Change password — wrong current password → error | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.11 | Change password — passwords don't match → error  | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.12 | Account section shows login email                | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.13 | Activity: member since date shown                | `✅` | `✅` | `✅` | `✅` |                                                                                     |
| 12.14 | Activity: last login date shown                  | `✅` | `✅` | `✅` | `✅` |                                                                                     |


---

## 13. MANAGEMENT — STRUCTURE (/management → Structure tab)


| #     | Feature                                                  | DIR | DEP | ADV | SP  | Comment                                                                                                                                                                                               |
| ----- | -------------------------------------------------------- | --- | --- | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13.1  | Management page accessible                               | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.2  | Structure tab loads hierarchy                            | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.3  | DIR sees all superregions                                | `✅` | N/A | N/A | N/A |                                                                                                                                                                                                       |
| 13.4  | DEP sees only own superregion                            | N/A | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.5  | Search by name works                                     | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.6  | Search by position code works                            | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.7  | Edit superregion name (DIR only)                         | `✅` | N/A | N/A | N/A |                                                                                                                                                                                                       |
| 13.8  | DEP cannot edit superregion name                         | N/A | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.9  | Change deputy (DIR only) — modal shows unassigned users  | ⚠️  | N/A | N/A | N/A | tak, pojawia się modal, ale przy zajętej pozycji deputy da się zmienić - tak nie powinno być - jeśli jest deputy na pozycji,, to wymagam confirma                                                     |
| 13.10 | Change deputy — user promoted to deputy role             | ⚠️  | N/A | N/A | N/A | aktualizacja roli wymaga odświezenia - pewnie tak jak reszta danych na tej stronie ma jakiś stale time - tez nie mocno istotne                                                                        |
| 13.11 | Remove deputy from position — confirm dialog             | `✅` | N/A | N/A | N/A |                                                                                                                                                                                                       |
| 13.12 | Edit region name works                                   | `✅` | `✅` | N/A | N/A | trzeba dodac edit region code (POM itp)                                                                                                                                                               |
| 13.13 | Move region to another superregion (DIR only)            | `✅` | N/A | N/A | N/A |                                                                                                                                                                                                       |
| 13.14 | Add position to region works                             | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.15 | Remove vacant position works                             | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.16 | Remove occupied position → blocked                       | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.17 | Remove position with active clients → blocked            | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.18 | Assign user to vacant position works                     | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.19 | Remove user from position (keep active) works            | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.20 | Archive user — reason required                           | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.21 | Archive user — removed from position, status archived    | ⚠️  | ⚠️  | N/A | N/A | Tutaj tez wymagane jest odswiezenie - warto to robic automatycznie po akcji archiwizacji.                                                                                                             |
| 13.22 | Move user between positions works                        | ⚠️  | ⚠️  | N/A | N/A | tu musi nastapic przeladowanie strony, bo kilka shuffli naraz i serwis się gubi - niby pojawia się toast z przeniesieniem (za 2gim razem) a nic się nie dzieje. PO odświezeniu strony wszystko dziala |
| 13.23 | DEP cannot move user to position outside own superregion | N/A | `✅` | N/A | N/A |                                                                                                                                                                                                       |
| 13.24 | Click user name → opens EditUserModal                    | `✅` | `✅` | N/A | N/A | Trzeba tutaj tez dodac przycisk do archiwizacji uzytkownika ( jeśli zajmuje jakąś pozycję - remove and archive, jeśli nie zajmuje zadnej -po prostu archive)                                          |
| 13.25 | Change position code works                               | ❌   | ❌   | N/A | N/A | Ta opcja powinna się znalezc w modalu menage position                                                                                                                                                 |


---

## 14. MANAGEMENT — USERS (/management → Users tab)


| #     | Feature                                                                    | DIR | DEP | ADV | SP  | Comment                                                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------- | --- | --- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14.1  | Users tab shows only active users                                          | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.2  | DIR sees all active users                                                  | `✅` | N/A | N/A | N/A |                                                                                                                                                                                                         |
| 14.3  | DEP sees only own superregion users                                        | N/A | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.4  | Search by name works                                                       | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.5  | Search by email works                                                      | ⚠️  | ⚠️  | N/A | N/A | mozna usunąc tę opcję - domyslnie mail to bedzie imie i nazwisko pracownika, a nie jego kod.                                                                                                            |
| 14.6  | Pagination works (10/20 rows)                                              | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.7  | Click user name → opens EditUserModal                                      | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.8  | EditUserModal — edit first/last name works                                 | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.9  | EditUserModal — edit email works                                           | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.10 | EditUserModal — edit phone works                                           | ⚠️  | ⚠️  | N/A | N/A | nie waliduje poprawności telefonu                                                                                                                                                                       |
| 14.11 | EditUserModal — grade shown for ADV/SP, hidden for DIR/DEP                 | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.12 | EditUserModal — save disabled when no changes                              | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.13 | EditUserModal — add note works                                             | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.14 | EditUserModal — DIR can delete any note                                    | `✅` | N/A | N/A | N/A | dodać confirm                                                                                                                                                                                           |
| 14.15 | EditUserModal — DEP can delete only own notes                              | N/A | `✅` | N/A | N/A | dodać confirm                                                                                                                                                                                           |
| 14.16 | Create user button visible                                                 | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.17 | Create user — all required fields (name, email, phone, password, position) | ⚠️  | ⚠️  | N/A | N/A | all required, nie sprawdza poprawności tel                                                                                                                                                              |
| 14.18 | Create user — grade shown only for non-deputy positions                    | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.19 | Create user — password visible (not masked)                                | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.20 | Create user — role derived from position (not selectable)                  | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |
| 14.21 | Create user — DEP cannot create in another superregion                     | N/A | ⚠️  | N/A | N/A | toast forbidden - trzeba dać lepszy opis, albo najlepiej przefiltrować wolne pozycje pod względem superregionu, zeby dla deputy 1 superregionu nie wyswietlaly sie vacant position innych superregionow |
| 14.22 | Create user — duplicate email → error                                      | `✅` | `✅` | N/A | N/A |                                                                                                                                                                                                         |


---

## 15. MANAGEMENT — REGIONS (/management → Regions tab)


| #     | Feature                                            | DIR | DEP | ADV | SP  | Comment                                                                                                  |
| ----- | -------------------------------------------------- | --- | --- | --- | --- | -------------------------------------------------------------------------------------------------------- |
| 15.1  | Regions tab shows superregions and subregions      | `✅` | `✅` | N/A | N/A |                                                                                                          |
| 15.2  | DIR sees all superregions                          | `✅` | N/A | N/A | N/A |                                                                                                          |
| 15.3  | DEP sees only own superregion                      | N/A | `✅` | N/A | N/A |                                                                                                          |
| 15.4  | Create new region — DIR can choose any superregion | `✅` | N/A | N/A | N/A |                                                                                                          |
| 15.5  | Create new region — DEP locked to own superregion  | N/A | `✅` | N/A | N/A |                                                                                                          |
| 15.6  | Create superregion button visible for DIR only     | `✅` | N/A | N/A | N/A |                                                                                                          |
| 15.7  | Create superregion button NOT visible for DEP      | N/A | `✅` | N/A | N/A |                                                                                                          |
| 15.8  | Create superregion works (DIR only)                | `✅` | N/A | N/A | N/A |                                                                                                          |
| 15.9  | Create region — name and prefix required           | ⚠️  | `✅` | N/A | N/A | wybranie superregionu te musi być wymagane - bez tegfo tworzy się superregion,a. od tego jest inna opcja |
| 15.10 | Duplicate region name → error                      | `✅` | `✅` | N/A | N/A |                                                                                                          |


---

## 16. ARCHIVE — CLIENTS (/archive → Clients tab)


| #     | Feature                                       | DIR | DEP | ADV | SP  | Comment |
| ----- | --------------------------------------------- | --- | --- | --- | --- | ------- |
| 16.1  | Archive page accessible for DIR only          | `✅` | N/A | N/A | N/A |         |
| 16.2  | Clients tab shows archived clients            | `✅` | N/A | N/A | N/A |         |
| 16.3  | Search by name, NIP, city works               | `✅` | N/A | N/A | N/A |         |
| 16.4  | Filter by salesperson works                   | `✅` | N/A | N/A | N/A |         |
| 16.5  | Sort by company name works                    | `✅` | N/A | N/A | N/A |         |
| 16.6  | Sort by last activity works                   | `✅` | N/A | N/A | N/A |         |
| 16.7  | Sort by ID works                              | `✅` | N/A | N/A | N/A |         |
| 16.8  | Pagination works                              | `✅` | N/A | N/A | N/A |         |
| 16.9  | Click company name → navigate to /clients/:id | `✅` | N/A | N/A | N/A |         |
| 16.10 | Unarchive action opens modal                  | `✅` | N/A | N/A | N/A |         |
| 16.11 | Unarchive — reason required                   | `✅` | N/A | N/A | N/A |         |
| 16.12 | Unarchive — client moves back to active       | `✅` | N/A | N/A | N/A |         |
| 16.13 | Unarchive — notification sent to salesperson  | `✅` | N/A | N/A | N/A |         |


---

## 17. ARCHIVE — EMPLOYEES (/archive → Employees tab)


| #     | Feature                                  | DIR | DEP | ADV | SP  | Comment       |
| ----- | ---------------------------------------- | --- | --- | --- | --- | ------------- |
| 17.1  | Employees tab shows archived users       | `✅` | N/A | N/A | N/A |               |
| 17.2  | Search by name works                     | `✅` | N/A | N/A | N/A |               |
| 17.3  | Search by position code works            | `✅` | N/A | N/A | N/A |               |
| 17.4  | Sort by name works                       | `✅` | N/A | N/A | N/A |               |
| 17.5  | Sort by archived date works              | `✅` | N/A | N/A | N/A |               |
| 17.6  | Last position code displayed             | `✅` | N/A | N/A | N/A |               |
| 17.7  | Archive reason displayed                 | `✅` | N/A | N/A | N/A |               |
| 17.8  | Archived date displayed                  | `✅` | N/A | N/A | N/A |               |
| 17.9  | Pagination works                         | `✅` | N/A | N/A | N/A |               |
| 17.10 | Click user name → navigate to /users/:id | `✅` | N/A | N/A | N/A |               |
| 17.11 | Unarchive action (to be implemented)     | 💬  | N/A | N/A | N/A | Not yet built |


---

## 18. EDGE CASES & CROSS-CUTTING


| #     | Feature                                                 | DIR | DEP | ADV | SP  | Comment                                                                                       |
| ----- | ------------------------------------------------------- | --- | --- | --- | --- | --------------------------------------------------------------------------------------------- |
| 18.1  | Vacant position shown correctly everywhere              | `✅` | `✅` | `✅` | `✅` | sprawdzone company i menage-structure                                                         |
| 18.2  | User without position — no position shown in UserPage   | `✅` | `✅` | 🔲  | 🔲  | userpage dostępny tylko dla deputy i directora                                                |
| 18.3  | Archived user visible in /archive/employees             | `✅` | N/A | N/A | N/A |                                                                                               |
| 18.4  | Archived user NOT visible in /management/users          | `✅` | `✅` | N/A | N/A |                                                                                               |
| 18.5  | Archived user NOT visible in company structure          | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.6  | Position history updated on assign                      | `✅` | `✅` | N/A | N/A |                                                                                               |
| 18.7  | Position history closed on remove/archive               | `✅` | `✅` | N/A | N/A |                                                                                               |
| 18.8  | Grade removed when user promoted to deputy              | ❌   | N/A | N/A | N/A |                                                                                               |
| 18.9  | Role updated when user moved to different position type | `✅` | `✅` | N/A | N/A |                                                                                               |
| 18.10 | Toast notifications appear on success                   | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.11 | Toast notifications appear on error                     | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.12 | Loader shown during data fetch                          | 🔲  | 🔲  | 🔲  | 🔲  | nie przetestowane - dane serwowane za szybko - trzeba sprawdzić przez throttling albo timeout |
| 18.13 | FetchError shown on API failure                         | `✅` | `✅` | `✅` | `✅` | komunikat "failed to load resources"                                                          |
| 18.14 | Modal cannot be closed by clicking outside              | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.15 | Modal closes with Escape key                            | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.16 | All date fields formatted consistently (en-GB)          | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.17 | Mobile responsive layout works on 375px width           | `✅` | `✅` | `✅` | `✅` |                                                                                               |
| 18.18 | Last login updates after login                          | `✅` | `✅` | `✅` | `✅` |                                                                                               |


---

## Summary


| Module               | Total   | Tested | Passed | Failed | Not Applicable |
| -------------------- | ------- | ------ | ------ | ------ | -------------- |
| Auth                 | 13      | 0      | 0      | 0      | 0              |
| Navigation           | 8       | 0      | 0      | 0      | 0              |
| Dashboard            | 1       | 0      | 0      | 0      | 0              |
| Clients List         | 17      | 0      | 0      | 0      | 0              |
| Add Client           | 8       | 0      | 0      | 0      | 0              |
| Client Detail        | 24      | 0      | 0      | 0      | 0              |
| Client Archive       | 9       | 0      | 0      | 0      | 0              |
| Calendar             | 21      | 0      | 0      | 0      | 0              |
| Notifications        | 13      | 0      | 0      | 0      | 0              |
| Company Structure    | 9       | 0      | 0      | 0      | 0              |
| User Detail          | 12      | 0      | 0      | 0      | 0              |
| Settings             | 14      | 0      | 0      | 0      | 0              |
| Management Structure | 25      | 0      | 0      | 0      | 0              |
| Management Users     | 22      | 0      | 0      | 0      | 0              |
| Management Regions   | 10      | 0      | 0      | 0      | 0              |
| Archive Clients      | 13      | 0      | 0      | 0      | 0              |
| Archive Employees    | 11      | 0      | 0      | 0      | 0              |
| Edge Cases           | 18      | 0      | 0      | 0      | 0              |
| **TOTAL**            | **238** | **0**  | **0**  | **0**  | **0**          |


