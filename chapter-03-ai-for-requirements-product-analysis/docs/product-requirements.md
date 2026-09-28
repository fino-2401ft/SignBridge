# TaskFlow product requirements

> **Provenance**
> - **Source prompts:** [P3.1 — Create product requirements](../prompts/create-product-requirements.prompt.md) and [P3.2 — Review product requirements](../prompts/review-product-requirements.prompt.md)
> - **Artifact status:** `Accepted reviewed sample`
> - **Human action:** Approved scope and accepted requirement corrections.
> - **Reproduction note:** P3.2 produces findings; only accepted findings are reflected here.

## Goal

Enable authenticated users to organize work as tickets on a simple four-lane board.

## Functional requirements

1. A user can register with a valid email and password, then log in with those credentials.
2. Invalid registration and login requests show a clear error without exposing sensitive authentication detail or discarding safe form values.
3. An authenticated user can create a board and access only associated boards. Protected access without a valid session returns the user to Login.
4. A user can create, read, edit, and delete tickets. A ticket requires a title; description is optional.
5. Every ticket is in exactly one fixed status: Backlog, Todo, Doing, or Done.
6. A user can create a ticket from any lane and move it with drag and drop on desktop, or edit its status through the ticket modal.
7. The board remains understandable with empty lanes; an empty lane can collapse and expand without changing workflow state.
8. A failed ticket save or move restores the prior persisted state, retains the user's draft, and exposes a retry path.

## Non-goals

No password reset, email verification, SSO, social login, assignments, due dates, notifications, checklists, custom columns, automations, reporting, or collaboration roles in this release.

## Acceptance signals

The main path is: register → login → create board → create ticket in any lane → edit title/description → move it → reload. Reusable board tags are a separately accepted product extension and must not be inferred from this baseline alone.
