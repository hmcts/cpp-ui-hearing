# Reserve a Slot — BUG-10: a refused reservation must not look like a successful pick

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** When courtscheduler refuses a reservation, the clerk is told and the draft is left untouched — instead of being redirected as though the pick succeeded.

**Blocking:** the user needs this to deploy to STE and test. It must be correct and self-contained; the `@cpp/scheduling` picker change (NEW-16) is explicitly NOT part of it and must not be waited on.

**Repo:** `cpp-ui-hearing`, branch `team/ccsph2`

## Global Constraints

- **NO COMMITS.** Everything stays unstaged. Any Commit step is an explicit no-op.
- **Author no new PDK element.** `<pdk-error-summary [errors]="errors">` is **already committed** in `crown-scheduling.component.ts` (line ~37) and its magistrates twin; reuse it exactly as it stands. `ValidationError` is `{ id: string; message: string; shouldFocus?: boolean }` from `@cpp/pdk`. If you think you need any other PDK element, **stop and report** — the `crime-frontend-developer-mcp` server is unreachable and project rules make it the only permitted source of PDK structural data.
- Run tests via the Angular builder, never bare jest:
  ```bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22.11.0
  npx ng test --watch=false --coverage=false --test-path-pattern="allocation"
  ```
- **Never run `npm ci`** — it wipes `node_modules`; the private `@cpp` registry needs VPN.

## The defect

`BookProvisionalHearingSlotsProcessor` publishes **the same event name for both outcomes**:

```java
if (!response.hasError()) { ...add("bookingId", ...).withName("public.hearing.hearing-slots-provisionally-booked")
} else {                    ...add("error", ...)    .withName("public.hearing.hearing-slots-provisionally-booked")
```

`ProvisionalBookingService.bookProvisionalHearingSlots` waits on that name with `commandSync`, so a **refusal resolves as a success** carrying `{error}` and no `bookingId`. Both pickers then map it unguarded:

```typescript
map(({ bookingId }) => ... bookingReference: bookingId )   // undefined on refusal
```

So the clerk is redirected as though it worked and the draft gets `bookingReference: undefined` while nothing is reserved.

This was latent until now. A capacity check added today (BUG-9) makes courtscheduler return 409 for a full session, which becomes that `error` payload — so this is now reachable in ordinary use.

---

### Task 1: Treat a refusal as a failure, tell the clerk, change nothing else

**Files:**
- Modify: `src/app/results/hearing-details/allocation/services/provisionalBooking.service.ts`
- Modify: `src/app/results/hearing-details/allocation/containers/crown-scheduling.container.ts`
- Modify: `src/app/results/hearing-details/allocation/containers/magistrates.container.ts`
- Modify: `src/app/results/hearing-details/allocation/components/crown-scheduling.component.ts` and its magistrates twin — **only** to accept externally-supplied errors
- Tests: the four corresponding specs

- [ ] **Step 1: Make the service fail on a refusal**

In `bookProvisionalHearingSlots`, pipe the `commandSync` result so an `error` payload — or a response with no `bookingId` — becomes an errored observable rather than a value. Keep the declared return type `Observable<{ bookingId: string }>`, which then tells the truth: a value always has a `bookingId`.

Use `switchMap`/`map` + `throwError` in the file's existing RxJS style. Carry the backend's message through so the containers can show it, and add a short comment explaining **why** this guard exists — that success and failure share an event name, so a refusal arrives as a resolved value. Without that comment the guard looks redundant and will be removed.

`releaseProvisionalHearingSlots` is unrelated. Leave it exactly as it is.

- [ ] **Step 2: Do not write the prompt or redirect on failure**

In **both** containers, the `switchMap` that calls the service gains a `catchError` which:
- does **not** dispatch `updateResultPromptsForDraftResultLine` (so no prompt is written and no `redirectTo` fires)
- records the failure so the screen can show it

Both containers `.subscribe(this.store)`, so the stream must not die: emit something the store tolerates, or restructure so the error path is handled before the store subscription. **Whatever you choose, a failed pick must leave the clerk on the picker with the sessions still listed** — do not let the error tear down the stream and blank the screen. Say in your report how you guaranteed that.

- [ ] **Step 3: Show it, using the error summary already on the screen**

Each component already declares `errors: ValidationError[] | null` and renders `<pdk-error-summary [errors]="errors">`, populated from child `(errors)` outputs. Add one input so the container can supply errors too — match the file's existing input convention (signal inputs vs `@Input()` — read it, do not assume) — and merge container-supplied errors with the child-supplied ones rather than replacing them, so form validation errors are not lost.

The message: reuse the existing translation key `MANAGE_HEARING.SESSION_NOT_AVAILABLE` — *"The session you have selected is now fully booked or is no longer available. Select another session."* It is already in `src/i18n/en.json` and reads correctly at pick time. Do not invent new copy.

Give the `ValidationError` a stable `id` so the summary can anchor it, and clear it when a later pick succeeds — a stale error above a working screen is its own bug.

- [ ] **Step 4: Tests**

In both container specs:
- a refusal (`{ error: 'no capacity' }`) dispatches **no** `updateResultPromptsForDraftResultLine` and performs no redirect
- a refusal surfaces an error to the component
- a success is unchanged — prompt written, `bookingReference` set to the returned `bookingId`
- a success **after** a refusal clears the earlier error

In the service spec:
- an `{ error }` payload produces an errored observable
- a `{ bookingId }` payload produces a value

The first test must fail against the current unguarded `map`. Verify that by running it before Step 1's change if you can, and say so.

- [ ] **Step 5: Run**

```bash
npx ng test --watch=false --coverage=false --test-path-pattern="allocation"
npx ng test --watch=false --coverage=false   # full suite: expect 2490+ passing, 0 failures
```

The full suite was green before this change; any new failure is yours.

- [ ] **Step 6: Commit** — **skipped, no commits.**

---

## Deliberately not in scope

- **NEW-16** (`@cpp/scheduling` refusing full sessions up front) — a different package, nice-to-have, and explicitly not required for this to be deployable.
- **Changing the backend to publish distinct event names.** That would make this class of bug impossible rather than guarded against, but it is a backend contract change and its own ticket.
