# Phase 8 QA Test Plan — Cinema Booking System

**System under test**: Vue 3/Vite frontend; Express/Node backend; SQLite persistence; local demo reservations (no payment gateway).

**Objectives**
1. Validate booking, authentication and cancellation behavior.
2. Verify logged-in users cannot access or cancel each other's orders.
3. Confirm past showtimes and invalid seats cannot be booked or cancelled.
4. Demonstrate automated regression tests and component tests.
5. Ensure responsive user experience on three viewport widths.

## Automated test matrix

| ID | Test level | Scenario | Expected result | Test file |
|---|---|---|---|---|
| UT-01 | Unit | Valid Malaysia showtime | Correct UTC time | `phase8.unit.test.js` |
| UT-02 | Unit | Invalid date / time | NaN returned | `phase8.unit.test.js` |
| UT-03 | Unit | Password verification | Correct accepts; wrong rejects | `phase8.unit.test.js` |
| API-01 | Integration | Unauthenticated booking | HTTP 401 | `phase8.api.test.js` |
| API-02 | Integration | Register, duplicate email | 201 then 409 | `phase8.api.test.js` |
| API-03 | Integration | Login wrong/right | 401 then 200 | `phase8.api.test.js` |
| API-04 | Integration | Movies, showtimes, seats | Correct data, past filtering | `phase8.api.test.js` |
| API-05 | Integration | Invalid seat, repeated seat, past showtime | HTTP 400 | `phase8.api.test.js` |
| API-06 | Integration | Double-booked seat | HTTP 409 | `phase8.api.test.js` |
| API-07 | Security | User B reads/cancels A booking | Empty list / HTTP 404 | `phase8.api.test.js` |
| API-08 | Integration | Owner cancels booking | 200, seats available | `phase8.api.test.js` |
| API-09 | Integration | Duplicate cancellation | HTTP 409 | `phase8.api.test.js` |
| API-10 | Integration | Rebook cancelled seat, FK integrity | 201, no FK errors | `phase8.api.test.js` |
| API-11 | Security | Logout then use old cookie | HTTP 401 | `phase8.api.test.js` |
| UI-01 | Component | Booking summary total | Correct RM amount | `BookingSummary.test.js` |
| UI-02 | Component | Booked seats disabled | Cannot click | `SeatMap.test.js` |
| UI-03 | Component | Maximum seats selected | Other seats disabled | `SeatMap.test.js` |

## Manual test matrix

| ID | Viewport/workflow | Expected result | Result |
|---|---|---|---|
| M-01 | Mobile 375px, movie list | Cards readable, no harmful overflow | TBD |
| M-02 | Tablet 768px, seat selection | Seats selectable/scrollable | TBD |
| M-03 | Desktop 1280px, full booking | Working through confirmation | TBD |
| M-04 | Two independent sessions | No access to other user's orders | TBD |
| M-05 | My Bookings status filters | Upcoming/Past/Cancelled correct | TBD |
| M-06 | Future cancellation | Seat released, order history retained | TBD |
| M-07 | Poster and empty/error states | No broken or clipped UI | TBD |
| M-08 | Frontend production build | `npm.cmd run build` succeeds | TBD |

## Exit criteria

- All backend and frontend automated tests pass on the user's Windows PC.
- Manual regression test cases M-01–M-08 pass or have documented defects.
- Code coverage results are reviewed (not assumed equivalent to correctness).
- No database or secrets are added to Git.
- Phase 8 test files, docs, and scripts committed to GitHub.

## Evidence

Record after local execution:

| Item | Observation |
|---|---|
| Backend test count | TBD |
| Backend failed | TBD |
| Frontend test count | TBD |
| Frontend failed | TBD |
| Backend coverage | TBD |
| Frontend coverage | TBD |
| Date tested | TBD |
| Git commit | TBD |

**Boundary:** No real payment processing is implemented or expected in Phase 8. Testing is for demo reservations only.
