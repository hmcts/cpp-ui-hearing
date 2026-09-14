# Reserve a Slot — cpp-ui-hearing Implementation Plan (NEW-11)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Crown slot-picker reserve the session at the moment the clerk picks it, and write the returned `bookingId` into the `bookingReference` prompt — exactly as the magistrates picker already does.

**Architecture:** `magistrates.container.ts` already calls `ProvisionalBookingService.bookProvisionalHearingSlots`, waits for `public.hearing.hearing-slots-provisionally-booked`, and writes the returned `bookingId` into `bookingReference`. Crown currently writes the raw `courtScheduleId` instead and reserves nothing. This plan gives Crown the same shape. No new service, no new component, no template change.

**Tech Stack:** Angular 19, NgRx, RxJS, TypeScript, Jest. `@cpp/pdk` is installed but **this plan touches no template and no PDK element**.

**Spec:** https://claude.ai/code/artifact/90e6b0eb-dc8a-4697-a8d4-8d9086d283d6
**Ticket:** NEW-11 in `cpp-context-hearing/docs/reserve-a-slot-jira.md`

**Repo:** `cpp-ui-hearing`, branch `team/ccsph2`

## Scope corrections made when this plan was written

**`related-hearings.container.ts` is deliberately excluded**, contrary to the ticket as originally written. That container sets `bookingReference` only when the related hearing already has a `courtScheduleId`, and in the same prompt map it sets `existingHearingId: relatedHearingSlot.hearingId`. That is the *attach to an already-listed hearing* path — and `HearingToHearingListingNeedsTransformer:179` in progression skips listing needs entirely when `existingHearingId` is present. Nothing is booked on that path, so reserving there would hold capacity for a hearing that already has its session: a double-hold. Update the ticket rather than the code.

**NEW-12 is not in this plan and is not a front-end ticket.** There is no release path from the browser: courtscheduler has `DELETE /sessions/{hearingId}`, but listing does not proxy it and hearing has no release command, so nothing between the browser and that endpoint can reach it. NEW-12 needs a BE ticket first (a hearing release command) and then the FE wiring.

## Global Constraints

- **No PDK element work.** This plan changes container logic only. If any step turns out to need a PDK component, directive or validator, **halt** — `crime-frontend-developer-mcp` is not reachable in this environment, and the project rules forbid writing a PDK element that has not been verified through it. Training-data knowledge of PDK or GOV.UK classes is never a substitute.
- **No template changes**, so the container-template-must-be-shell rule is not engaged.
- The `bookingReference` prompt value becomes the **`bookingId`**, never the `courtScheduleId`. Getting this wrong is the whole point of the change.
- `magistrates.container.ts` must not be modified — it is the reference implementation and already correct.
- The pick can now **fail**. `bookProvisionalHearingSlots` previously always succeeded; it now goes through capacity-holding reservation and can be refused. This plan must not swallow that failure, but the user-facing message is NEW-13's job — here, a failure must simply not write the prompt.
- Send `duration` with the booking. courtscheduler needs it for duration-based sessions and rejects with 400 without it; Crown already has the value in scope.

**Build and test commands**

```bash
npx jest src/app/results/hearing-details/allocation --silent
npx tsc --noEmit -p tsconfig.json
```
Match whatever the repo's `package.json` scripts actually define — prefer `npm test -- <path>` if that is the convention.

---

### Task 1: Crown reserves the session at pick time

**Files:**
- Modify: `src/app/results/hearing-details/allocation/containers/crown-scheduling.container.ts`
- Modify: `src/app/results/hearing-details/allocation/services/provisionalBooking.service.ts` (only if `duration` needs adding to its request type)
- Test: `src/app/results/hearing-details/allocation/containers/crown-scheduling.container.spec.ts`

**Interfaces:**
- Consumes: `ProvisionalBookingService.bookProvisionalHearingSlots({ hearingId, courtScheduleBookings, ...filters })` → `Observable<{ bookingId: string }>`. Already exists and is already used by the magistrates container. It posts `hearing.book-provisional-hearing-slots` and resolves on `public.hearing.hearing-slots-provisionally-booked`.
- Produces: no new exported API. The `bookingReference` prompt written by this container becomes a `bookingId`.

**Read first, then write.** Open `magistrates.container.ts` around lines 215-285 and copy its shape: build `courtScheduleBookings`, call the service inside a `switchMap`, and `map` the returned `bookingId` into the prompt map before dispatching `updateResultPromptsForDraftResultLine`. Crown's existing code builds the same prompt map inside a `map` — it becomes a `switchMap` over the service call.

- [ ] **Step 1: Write the failing tests**

Add to `crown-scheduling.container.spec.ts`, matching the file's existing harness (read it first — reuse its `TestBed` setup, its store mock and its existing spies rather than inventing new ones):

```typescript
  it('reserves the picked session and writes the returned bookingId as bookingReference', () => {
    const bookingId = 'bk-1111-2222';
    provisionalBookingService.bookProvisionalHearingSlots.mockReturnValue(of({ bookingId }));

    // invoke whatever method the existing tests use to simulate the clerk confirming a pick
    component.onSlotAllocationsConfirmed(hearingSlotAllocations, hearingType);

    expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        hearingId,
        courtScheduleBookings: [
          expect.objectContaining({ courtScheduleId: 'cs-9999' })
        ]
      })
    );

    const dispatched = store.dispatch.mock.calls.at(-1)[0];
    const bookingRefPrompt = dispatched.resultPrompts.find(p => p.promptRef === 'bookingReference');
    expect(bookingRefPrompt.value).toBe(bookingId);
    expect(bookingRefPrompt.value).not.toBe('cs-9999');
  });

  it('does not write any prompt when the reservation fails', () => {
    provisionalBookingService.bookProvisionalHearingSlots.mockReturnValue(
      throwError(() => new Error('no capacity'))
    );

    component.onSlotAllocationsConfirmed(hearingSlotAllocations, hearingType);

    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringContaining('updateResultPromptsForDraftResultLine') })
    );
  });

  it('sends the duration with the booking', () => {
    provisionalBookingService.bookProvisionalHearingSlots.mockReturnValue(of({ bookingId: 'bk-1' }));

    component.onSlotAllocationsConfirmed(hearingSlotAllocations, hearingType);

    expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        courtScheduleBookings: [expect.objectContaining({ duration: expect.any(Number) })]
      })
    );
  });
```

The `not.toBe('cs-9999')` assertion in the first test is the one that matters — it is what catches an implementation that calls the service correctly and then still writes the session id into the prompt.

Replace `onSlotAllocationsConfirmed` and the fixture names with whatever the existing spec actually uses.

- [ ] **Step 2: Run them to verify they fail**

```bash
npx jest src/app/results/hearing-details/allocation/containers/crown-scheduling.container.spec.ts
```
Expected: FAIL — the service is never called, and the prompt still carries `hearingSlot.courtScheduleId`.

- [ ] **Step 3: Reserve before writing the prompt**

In `crown-scheduling.container.ts`, the `combineLatest([...]).pipe(take(1), map(...))` chain that currently builds `promptRefToValueMap` becomes a `switchMap` that reserves first. Build the bookings from the allocations the clerk confirmed:

```typescript
          const courtScheduleBookings = hearingSlotAllocations.map(allocation => ({
            courtScheduleId: allocation.hearingSlot.courtScheduleId,
            hearingStartTime: allocation.hearingSlotTime,
            duration: allocation.duration
          }));
```

then reserve and map the id into the prompt, replacing the current `bookingReference: hearingSlot.courtScheduleId` line:

```typescript
          return this.provisionalBookingService
            .bookProvisionalHearingSlots({ hearingId, courtScheduleBookings })
            .pipe(
              map(({ bookingId }) =>
                DraftResultActions.updateResultPromptsForDraftResultLine({
                  resultLineId,
                  redirectTo,
                  resultPrompts: [
                    ...createDraftResultPromptsFromValueMap(promptChoices, {
                      ...promptRefToValueMap,
                      bookingReference: bookingId
                    }),
                    createNameAddressResultPromptForCourtCentre(
                      promptChoices.find(isNameAddressPromptChoice),
                      organisationUnits.find(ou => ou.oucode === hearingSlot.ouCode)
                    )
                  ]
                })
              )
            );
```

Keep every other entry in `promptRefToValueMap` exactly as it is — `fixedDate`, `HDATE`, `timeOfHearing`, `HCROOM`, `HTYPE`, `HEST` are unchanged. Only `bookingReference` changes meaning, and only the surrounding operator changes from `map` to `switchMap`.

`duration` on the bookings is new: check whether `ProvisionalBookingService`'s request type declares it, and add it as an optional field if not. Do not make it required — the magistrates caller may not always supply one.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/app/results/hearing-details/allocation/containers/crown-scheduling.container.spec.ts
```
Expected: PASS, including the pre-existing tests in that spec. If a pre-existing test asserted `bookingReference` equals the `courtScheduleId`, **update it to the new meaning rather than deleting it**, and say so in your report.

- [ ] **Step 5: Type-check and run the wider suite**

```bash
npx tsc --noEmit -p tsconfig.json
npx jest src/app/results/hearing-details/allocation --silent
```
Expected: no type errors; the allocation suite green. Watch for magistrates specs breaking — they must not, since that container is untouched.

- [ ] **Step 6: Commit**

*Skipped when the controller has instructed no commits — otherwise:*

```bash
git add src/app/results/hearing-details/allocation
git commit -m "feat: Crown reserves the picked session and stores its bookingId

bookingReference now carries the bookingId courtscheduler mints at pick time,
matching magistrates, so the session is held until the result is shared."
```

---

## Deliberately not in scope

- **`related-hearings.container.ts`** — see the scope correction above. It attaches to an already-listed hearing; reserving there would double-hold.
- **`magistrates.container.ts`** — already correct, and the reference for this change.
- **The clerk-facing messages (NEW-13)** — a failed reservation must not write the prompt, but telling the clerk why needs `pdk-notification-banner`, and that cannot be written while `crime-frontend-developer-mcp` is unreachable.
- **Release on re-pick (NEW-12)** — needs a BE release command first; see above.
