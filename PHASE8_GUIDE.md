# Phase 8 – Software Testing & Quality Assurance

This kit is an **additive patch**, built against the previously supplied `cinema-booking-phase7-full.zip` + Phase 6 backend. It adds tests and `vitest.config.js`, and does not replace your application code, database, `package.json`, Git history or UI modifications. 

## Prerequisites

- Windows, VS Code, Node.js satisfying the existing frontend `engines` (`^22.18.0` or `>=24.12.0`), npm.
- Backup or commit local work before copying files.
- Backend must have `backend/database/db.js`, `backend/database/schema.sql`, `backend/utils/showtime.js`, `backend/auth/password.js`, and `backend/server.js` exporting the Express app.
- Node's built-in `node:sqlite` is used in this project. The `ExperimentalWarning: SQLite...` message may appear in some Node 22 versions.

## Install (additive copy)

1. Unzip this patch. Copy only the `backend`, `frontend` test/config folders into the project root, allowing folder merge. **Do not delete the current project folders.**
2. If `backend/tests/phase6.test.js` is missing from your local project, copy `optional/phase6.test.js` to `backend/tests/phase6.test.js`. If it exists, **retain your version**.
3. Do not copy the optional folder into the project; it is only a reference.
4. In PowerShell, from `backend`:

   ```powershell
   npm.cmd pkg set "scripts.test=node --test tests/phase6.test.js tests/phase8.unit.test.js tests/phase8.api.test.js"
   npm.cmd pkg set "scripts.test:coverage=node --test --experimental-test-coverage tests/phase6.test.js tests/phase8.unit.test.js tests/phase8.api.test.js"
   npm.cmd test
   npm.cmd run test:coverage
   ```

   **No server needs to be running** for these tests: they open an in-process Express server on an ephemeral port and a **fresh disposable SQLite database in the OS temporary directory**, not `cinema.db`.

5. In a second PowerShell terminal, from `frontend`:

   ```powershell
   npm.cmd install -D "vitest@^4.1" "@vitest/coverage-v8@^4.1" "@vue/test-utils@^2" "jsdom@^27"
   npm.cmd pkg set "scripts.test=vitest run" "scripts.test:coverage=vitest run --coverage"
   npm.cmd test
   npm.cmd run test:coverage
   npm.cmd run build
   ```

   The `frontend/vitest.config.js` is a separate test config which uses the Vue Vite plugin and jsdom. Coverage reports are written to `frontend/coverage/`.

6. Append these lines to your **root `.gitignore`** (if missing):

   ```gitignore
   coverage/
   .vitest/
   node_modules/
   *.db
   *.db-*
   ```

7. From project root check `git status`; `package.json`/`package-lock.json` and new tests/config should be tracked; `.db`, `node_modules`, coverage output and backups should not.

## Explanation of tests

- `phase6.test.js`: existing cancellation/auth/ownership/seat release tests.
- `phase8.unit.test.js`: timezone, malformed showtimes, leap dates, password verification.
- `phase8.api.test.js`: registration, login, read APIs, booking validation, user isolation, duplicate-seat protection, cancellation, released-seat rebooking, database FK integrity and logout.
- `BookingSummary.test.js`: zero seats, amount, confirm event, submit disablement.
- `SeatMap.test.js`: booked seat disablement, emitted selection, max-seats rule and submit disablement.

## Manual regression checklist

Run Backend and Frontend separately:

```powershell
# Terminal 1
cd "C:\Users\User\Desktop\cinema-booking\cinema-booking-system\backend"
node server.js

# Terminal 2
cd "C:\Users\User\Desktop\cinema-booking\cinema-booking-system\frontend"
npm.cmd run dev
```

Check at `http://localhost:5173`:

- [ ] `/api/health` responds; movies/showtimes load.
- [ ] Log in as Account A and complete a **future** demo booking.
- [ ] Cannot reserve the same seat twice.
- [ ] In a private/incognito window, Account B cannot view or cancel Account A's bookings.
- [ ] Cancel Account A's future booking; seats become available again.
- [ ] Account B can reserve a released seat.
- [ ] My Bookings `Upcoming`, `Past`, `Cancelled` filters display the correct records.
- [ ] Movie images and fallback posters load (if added in the UI-refinement step).
- [ ] Check mobile (375px), tablet (768px) and desktop (1280px) in Chrome DevTools; no clipped buttons or unusable seat map.
- [ ] `npm.cmd run build` passes in `frontend`.

## Common issues

- `Error: no test specified`: `backend/package.json` still contains npm's default test script. Run the `npm.cmd pkg set` commands above **from the backend folder**.
- `Cannot find module '../utils/showtime'`: the local Phase 6 Backend files don't match the snapshot; do not blindly overwrite them. Check the project's existing helpers and adapt the test imports.
- `npm ERR! engine`: upgrade Node to satisfy the project's frontend engine requirement.
- `Cannot find module 'vitest'`/`jsdom`: run the frontend `npm.cmd install -D ...` command from the `frontend` folder.
- Registration/API tests fail: compare your current route request/response schema with `phase8.api.test.js`. This kit targets the Phase 6 server from your prior upload, which may differ from a later edited copy.
- Do **not** start the actual `node server.js` for unit/integration tests; the test runner imports Express and listens on a random local test port.

## Baseline verification

On the prior uploaded Phase 7 snapshot in a separate runtime:

- Backend `node --test tests/phase6.test.js tests/phase8.unit.test.js tests/phase8.api.test.js`: **26 pass, 0 fail**.
- Vue tests: test source prepared, **not executed** in the build container because fetching Vitest/jsdom dependencies was unavailable. Run them on your Windows PC and report any failures.

## Save to GitHub (only when passing)

```powershell
cd "C:\Users\User\Desktop\cinema-booking\cinema-booking-system"
git status
git add backend/tests backend/package.json frontend/src/components/__tests__ frontend/vitest.config.js frontend/package.json frontend/package-lock.json .gitignore
git diff --cached --stat
git commit -m "Complete Phase 8 software testing and quality assurance"
git push origin main
```

Make sure you don't accidentally stage local database files or login credentials.
