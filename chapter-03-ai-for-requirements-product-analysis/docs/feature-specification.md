# Authentication and ticket board feature specification

> **Provenance**
> - **Source prompt:** [P3.3 — Create feature specification](../prompts/create-feature-specification.prompt.md)
> - **Artifact status:** `Accepted reviewed sample`
> - **Human action:** Approved success, failure, recovery, persistence, and authorization behavior.
> - **Reproduction note:** This artifact is created only after the PRD review gate passes.

## Authentication lifecycle

Register accepts email, password and password confirmation in the UI. Email must be syntactically valid; password must meet the documented minimum; confirmation must match before submission. Successful registration returns to Login with the email preserved. Login accepts email/password, prevents duplicate submit while pending, reports invalid credentials at form level, and opens the user's board collection after success. Protected access with an invalid or expired session returns to Login. Password reset, email verification, SSO and social login are excluded.

## Ticket lifecycle

The board displays four peer lanes in the order Backlog, Todo, Doing, Done. Each lane has its own add control so a user can create a ticket directly in the intended status. The global “New ticket” action defaults to Backlog. The create/edit form is a centered modal with title, optional description, status, and tags.

## Move behavior

The unit of work is called **ticket** everywhere. Desktop pointer drag displays a moving ticket overlay and a clear drop target. Keyboard and narrow viewports use the Status control. After a successful save the new state remains; on failure the UI returns to the previous lane and retains entered fields so retry is safe.

## UI constraints

The later design artifact defines the visual solution. This specification requires labelled, keyboard-usable auth forms; centered ticket forms; visible failure/loading states; and text labels independent of colour, without prescribing glass, tokens, or component geometry.
