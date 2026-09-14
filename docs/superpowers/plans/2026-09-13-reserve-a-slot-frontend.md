# Reserve a Slot — front end (BUG-4, NEW-12, NEW-13, NEW-14, NEW-15 FE)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the browser reserve, release and gate correctly against the reserve-a-slot backend, which is complete and reviewed.

**Architecture:** Container and service logic only. **No new PDK element is authored anywhere in this plan** — the one visual change reuses `<pdk-alert>` exactly as it already appears, committed and compiling, in `manage-hearing.container.html`, and varies only its translation key.

**Tech Stack:** Angular 19.2, NgRx, RxJS, Jest. Node **v22.11.0** via nvm.

**Spec:** https://claude.ai/code/artifact/90e6b0eb-dc8a-4697-a8d4-8d9086d283d6 · tickets in `cpp-context-hearing/docs/reserve-a-slot-jira.md`
**Repo:** `cpp-ui-hearing`, branch `team/ccsph2`

## Global Constraints

- **NO COMMITS.** No `git add`, `git commit`, `git stash`, `git rm`. Everything stays unstaged. Any "Commit" step is an explicit no-op.
- **Do not author a PDK element that is not already in this repo.** The `crime-frontend-developer-mcp` server is unreachable this session, and project rules make it the only permitted source of PDK structural data. Copying markup that already exists, committed, in this repo is fine — that is not recall, it is reuse. **Inventing a selector, input or class is not.** If you find yourself needing a PDK element that is not already present somewhere in `src/app`, stop and report.
- **`magistrates.container.ts` is the reference implementation** for booking. Change it only where this plan says so.
- Run tests with the Angular builder, not bare jest — bare jest misses the jsdom environment and the TS transform:
  ```bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22.11.0
  npx ng test --watch=false --coverage=false --test-path-pattern="<pattern>"
  ```
- `npm install` has been run and `node_modules/.bin` is populated. Do **not** run `npm ci` — it wipes `node_modules`, and the private `@cpp` registry is only reachable over VPN.

## Backend contract (built, reviewed, ready — do not change it)

- **Booking status:** `POST /listing-query-api/query/api/rest/listing/bookingStatus`, request media type `application/vnd.listing.query.booking.status+json`, body `{"bookingIds":[...]}`, response `{"bookings":[{"bookingId","safeToShare","status"}]}` where `status` is `RESERVED` | `SHARED` | `LEGACY` | `NONE` | `UNKNOWN`.
  - `safeToShare` is `status !== 'NONE'`. `UNKNOWN` means listing could not reach courtscheduler and **failed open** — it is safe to share and must not block.
- **Reserve:** unchanged — `POST /hearings/{hearingId}/hearing-slots`, `application/vnd.hearing.book-provisional-hearing-slots+json`, resolving on `public.hearing.hearing-slots-provisionally-booked`. It now accepts an **optional top-level `bookingId`**: supplied means *reuse this booking* (the backend releases the previous pick's hold in the same transaction), absent means *mint a new one*.
- **Release:** `POST /hearings/{hearingId}`, `application/vnd.hearing.release-provisional-hearing-slots+json`. Best-effort and idempotent — releasing an unknown or already-released booking is a no-op, never an error. Confirm the exact path and body shape against `cpp-context-hearing/hearing-command/hearing-command-api/src/raml/hearing-command-api.raml` (the action is declared around line 391) and its request schema before writing the call.

---

### Task 1: Gate the share on the booking, not on session availability (BUG-4 + NEW-14 + NEW-13)

**Files:**
- Modify: `src/app/core/services/listing/listing.service.ts`
- Modify: `src/app/results/share-results/session-availability.helper.ts`
- Modify: `src/app/results/share-results/share-result.container.ts:151-196`
- Modify: `src/app/manage-hearing/manage-hearing.container.ts:~144, ~454, ~465-473`
- Modify: `src/app/manage-hearing/manage-hearing.container.html:5-11` — **translation key only**
- Modify: `src/i18n/en.json` (the `MANAGE_HEARING` block, around line 290)
- Test: the corresponding `.spec.ts` files

**Why this is a defect fix, not a feature.** `session-availability.helper.ts` reads a Crown `NHCCS` line's `bookingReference` prompt and passes it to `validateSessionAvailability` **as a `courtScheduleId`**. NEW-11 (already built, suite green) changes that value to a **bookingId**. Listing forwards it to courtscheduler, which answers `"Court Schedule Ids not found"` → 400 → the container's `catchError` sets `hasSessionAvailabilityError` → **every Crown NHCCS share is blocked.** The two changes are individually sensible and mutually destructive, so this must land before NEW-11 ships.

- [ ] **Step 1: Add the booking-status call**

In `listing.service.ts`, beside `validateSessionAvailability` (around line 39), mirroring its shape exactly:

```typescript
  getBookingStatus(bookingIds: string[]): Observable<{
    bookings: { bookingId: string; safeToShare: boolean; status: string }[];
  }> {
    return this.api.command({
      url: '/listing-query-api/query/api/rest/listing/bookingStatus',
      requestType: 'application/vnd.listing.query.booking.status+json',
      body: { bookingIds }
    });
  }
```

Match the file's actual `api.command` signature and return typing — read the neighbouring method rather than assuming.

- [ ] **Step 2: Collect booking references instead of deriving court schedule ids**

Rewrite `session-availability.helper.ts` to return the **bookingReferences to check**, not `{courtScheduleId, duration}`. Two rules, both load-bearing:

1. Keep the existing `NHCCS` filter — magistrates' NHMC must not be re-validated, as the current comment explains.
2. **Skip any result line whose prompts include `existingHearingId`.** That is `related-hearings.container.ts`'s attach-to-an-already-listed-hearing path: it writes a genuine `courtScheduleId` into `bookingReference`, nothing is booked, and feeding that value to the new endpoint would return `NONE` and wrongly block the share. Comment this, naming the container, so it is not "tidied" away.

Rename the export to something honest (e.g. `getBookingReferencesToCheck`) and update the `duration` handling — it is no longer needed, so remove `getDurationInMinutes` if nothing else uses it.

- [ ] **Step 3: Gate on the booking status**

In `share-result.container.ts`, `validateSessionAvailabilityAndShare` becomes a single call rather than a `forkJoin` per court schedule:

```typescript
          const bookingReferences = getBookingReferencesToCheck(draftResult);

          if (bookingReferences.length === 0) {
            return of({ blocked: false as const });
          }

          return this.listingService.getBookingStatus(bookingReferences).pipe(
            map(response => {
              const unsafe = (response?.bookings ?? []).filter(b => b.safeToShare === false);
              return unsafe.length === 0
                ? { blocked: false as const }
                : { blocked: true as const, status: unsafe[0].status };
            }),
            catchError(() => of({ blocked: false as const }))
          );
```

**The `catchError` failing open is deliberate and must not be "tightened".** listing already fails open internally, answering `UNKNOWN`/`safeToShare: true` when courtscheduler is unreachable. Blocking every share in the building during a transient blip, for an advisory check, is worse than letting one through — the share itself still validates server-side. Comment it saying so.

Extend `ShareValidationResult` with an optional `sessionUnavailableReason?: string` carrying that `status`, and emit it alongside `hasSessionAvailabilityError: true`.

- [ ] **Step 4: The clerk messages (NEW-13) — translation keys only**

In `manage-hearing.container.ts`, `sessionNotAvailableHandler` takes the reason and stores a key:

```typescript
  sessionNotAvailableHandler(reason?: string): void {
    this.sessionNotAvailable = true;
    this.sessionNotAvailableKey =
      reason === 'NONE'
        ? 'MANAGE_HEARING.SESSION_RESERVATION_EXPIRED'
        : 'MANAGE_HEARING.SESSION_NOT_AVAILABLE';
    this.window.scroll(0, 0);
  }
```

Initialise `sessionNotAvailableKey = 'MANAGE_HEARING.SESSION_NOT_AVAILABLE'` beside `sessionNotAvailable = false` (around line 144), and reset it where `sessionNotAvailable` is reset (around line 454).

In `manage-hearing.container.html`, change **only** the interpolated key — the element, its attributes and its `data-test-id` stay exactly as they are:

```html
        {{ sessionNotAvailableKey | translate }}
```

In `src/i18n/en.json`, beside the existing `SESSION_NOT_AVAILABLE` (around line 290), add:

```json
    "SESSION_RESERVATION_EXPIRED": "The session you reserved has expired and been released. Select another session."
```

**Flag in your report that this copy needs content-design sign-off** — it is written to match the neighbouring message's tone, but the exact wording is not yours or mine to settle.

Do not touch `<pdk-alert>` itself. Do not add a new element.

- [ ] **Step 5: Tests**

Update `session-availability.helper.spec.ts` (or create it if absent) and `share-result.container.spec.ts`:

- an `NHCCS` line with a `bookingReference` yields that reference
- a line **with `existingHearingId` is skipped** — this is the related-hearings regression guard and is the most important of these
- a non-`NHCCS` line is skipped
- `safeToShare: false` blocks the share and emits the reason
- `safeToShare: true` (including `status: 'UNKNOWN'`) shares
- a thrown error **shares** (fails open) — assert the share proceeds, not merely that no error is thrown

- [ ] **Step 6: Run**

```bash
npx ng test --watch=false --coverage=false --test-path-pattern="share-results|manage-hearing"
```

Expected: PASS. Existing specs asserting the old `validateSessionAvailability` behaviour must be **updated to the new meaning, not deleted** — say in your report which you changed and why.

- [ ] **Step 7: Commit** — **skipped, no commits.**

---

### Task 2: Re-pick reuses the bookingId (NEW-15, front-end half)

**Files:** `src/app/results/hearing-details/allocation/services/provisionalBooking.service.ts`, `.../containers/crown-scheduling.container.ts`, `.../containers/magistrates.container.ts`, plus their specs.

**Interfaces:** `bookProvisionalHearingSlots` gains an optional `bookingId`. When supplied, the backend reuses that booking and releases the previous pick's hold in the same transaction; when absent it mints one. The returned id is then the same value, so writing it back into the prompt is a harmless no-op.

- [ ] **Step 1: Thread the optional field**

Add `bookingId?: string` to the service's parameter type and include it in the body **only when set** — an explicit `undefined` key would serialise and the backend schema forbids unknown/null shapes:

```typescript
      body: {
        ...filters,
        ...(bookingId ? { bookingId } : {}),
        slots: courtScheduleBookings
      }
```

- [ ] **Step 2: Send the existing reference from both pickers**

Both containers already have `resultLine` in scope (they destructure `promptChoices` from it). Read the existing value and pass it:

```typescript
          const existingBookingReference = (resultLine as ExtendedResolvedDraftResultLine).resultPrompts
            ?.find(prompt => prompt.promptRef === 'bookingReference')?.value as string | undefined;
```

then `.bookProvisionalHearingSlots({ hearingId, courtScheduleBookings, bookingId: existingBookingReference })`.

**This is the one place `magistrates.container.ts` changes**, and it changes identically to Crown. Keep both call sites the same shape.

- [ ] **Step 3: Tests**

In both container specs: a first pick sends **no** `bookingId`; a re-pick on a line that already carries a `bookingReference` sends **that** value. Assert the absent case with `expect.not.objectContaining({ bookingId: expect.anything() })` or by inspecting the actual argument — do not assert `bookingId: undefined`, which passes vacuously.

- [ ] **Step 4: Run**

```bash
npx ng test --watch=false --coverage=false --test-path-pattern="allocation/containers"
```

Expected: PASS, 14 pre-existing tests included.

- [ ] **Step 5: Commit** — **skipped, no commits.**

---

### Task 3: Release the hold when the clerk abandons it (NEW-12)

**Files:** a new service method beside `ProvisionalBookingService`, plus the effects that handle result-line deletion and reset-results. Tests alongside.

**Scope, already reduced.** Re-picking is handled server-side by Task 2, so this ticket is now only the paths where a booking is abandoned with **no new pick following it**:

1. `destroyDraftResultLine` on a DRAFT line
2. the same on a SHARED line via amend (`DraftResultLineOptionsComponent.handleDestroyResultLine`, which demands an amendment reason first)
3. reset-results (`share-results.effects.ts`, the `isResetResults: true` saves)

**Why these matter more than re-picking did.** On a re-pick the `bookingReference` is still in the draft, so the backend can release the old hold. On a delete the prompt goes **with** the line — afterwards nothing anywhere points at that bookingId. The hold is not merely unreleased but unreleasable, and only the 01:00 purge recovers it. So the release must fire at the moment of deletion, while the reference is still in hand.

- [ ] **Step 1: Add the release call**

Confirm the path and body against the hearing RAML (`hearing.release-provisional-hearing-slots`, around line 391) and its request schema **before writing it**. Then add a method mirroring `bookProvisionalHearingSlots`'s style. It is fire-and-forget: the backend swallows "nothing to release", so the UI must never surface an error from it or block on it.

- [ ] **Step 2: Release on the three paths**

In the effects handling those actions, read the line's `bookingReference` **before** the draft is rebuilt without it, and dispatch the release. Order matters: read first, then destroy.

Only release when a `bookingReference` is actually present, and **only for lines that carry no `existingHearingId`** — same related-hearings exclusion as Task 1, for the same reason.

- [ ] **Step 3: Tests**

- deleting a line carrying a `bookingReference` calls release with that id
- deleting a line with no `bookingReference` calls nothing
- deleting a related-hearings line (has `existingHearingId`) calls nothing
- a failing release does **not** block the deletion — assert the delete still completes

- [ ] **Step 4: Run**

```bash
npx ng test --watch=false --coverage=false --test-path-pattern="results/core/store|enter-results"
```

- [ ] **Step 5: Commit** — **skipped, no commits.**

---

## Deliberately not in scope

- **`related-hearings.container.ts` writing a `courtScheduleId` into `bookingReference`.** Tasks 1 and 3 both route around it. Changing what that container writes is a separate decision with its own blast radius — record it, do not fix it here.
- **A "successfully reserved" confirmation message.** The third of the three clerk messages is a pick-time confirmation, not a share-time gate outcome; it belongs with the picker, not this gate.
- **Anything requiring a PDK element not already in the repo.**
