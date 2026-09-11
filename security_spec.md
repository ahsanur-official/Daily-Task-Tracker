# Security Specification & Threat Model

## 1. Data Invariants
1. **Identity Isolation**: All documents in `/users/{userId}`, `/goals/{goalId}`, `/tasks/{taskId}`, and `/sessions/{sessionId}` must strictly belong to the authenticated user (`request.auth.uid == userId`).
2. **Owner Immutability**: The `userId` field on all entities is immutable once created. An authenticated user cannot reassign an existing goal, task, or session to another user.
3. **No Blanket Queries**: All `allow list` queries require authentication and enforce that the queried resource belongs to `request.auth.uid`.
4. **Relational Integrity**: A task cannot be created with a non-string or arbitrary sized `goalId`.
5. **Payload Size Bounds**: All string, array, and ID fields are strictly constrained in length (e.g. max ID 128 chars, max title 140 chars) to prevent Denial of Wallet attacks.
6. **Certificate Verification**: Certificates can be read for public verification by exact ID, but can only be created by the authenticated owner whose `userId == request.auth.uid`.

## 2. The Dirty Dozen Payloads (Adversarial Security Tests)
1. **Payload 1: Unauthenticated Goal Creation**
   - Attempt: `POST /goals/hack1` without `request.auth`
   - Expected: `PERMISSION_DENIED`
2. **Payload 2: Identity Spoofing in Goal Creation**
   - Attempt: User `attacker_uid` submits `{ id: 'g1', userId: 'victim_uid', title: 'Hacked Goal' }`
   - Expected: `PERMISSION_DENIED` (fails `incoming().userId == request.auth.uid`)
3. **Payload 3: User Profile Takeover**
   - Attempt: User `attacker_uid` submits write to `/users/victim_uid`
   - Expected: `PERMISSION_DENIED` (fails `userId == request.auth.uid`)
4. **Payload 4: Reassigning Goal Ownership**
   - Attempt: User `user_1` updates `goal1` setting `userId = 'user_2'`
   - Expected: `PERMISSION_DENIED` (immutable `userId`)
5. **Payload 5: Oversized String Injection (Denial of Wallet)**
   - Attempt: Submit goal title with 10,000 characters
   - Expected: `PERMISSION_DENIED` (fails `title.size() <= 140`)
6. **Payload 6: Path ID Traversal / Junk Characters**
   - Attempt: Document ID `../../evil` or non-alphanumeric junk
   - Expected: `PERMISSION_DENIED` (fails `isValidId()`)
7. **Payload 7: Cross-User Task Listing**
   - Attempt: Attacker queries `tasks` collection where `userId != attacker_uid`
   - Expected: `PERMISSION_DENIED` (fails list rule check)
8. **Payload 8: Session Duration Manipulation (Negative Value)**
   - Attempt: Submit session with `durationSeconds: -500`
   - Expected: `PERMISSION_DENIED` (fails `durationSeconds >= 0`)
9. **Payload 9: Ghost Field Injection in Update**
   - Attempt: Update task adding unexpected field `isAdmin: true`
   - Expected: `PERMISSION_DENIED` (fails `affectedKeys().hasOnly(...)`)
10. **Payload 10: Task Creation Forged User**
    - Attempt: User `attacker_uid` creates task with `userId: 'victim_uid'`
    - Expected: `PERMISSION_DENIED` (fails `incoming().userId == request.auth.uid`)
11. **Payload 11: Forging Certificate Ownership**
    - Attempt: Attacker issues certificate claiming `userId: 'victim_uid'`
    - Expected: `PERMISSION_DENIED` (fails `incoming().userId == request.auth.uid`)
12. **Payload 12: Deleting Another User's Goal**
    - Attempt: Attacker sends delete request to `/goals/victim_goal`
    - Expected: `PERMISSION_DENIED` (fails `existing().userId == request.auth.uid`)
