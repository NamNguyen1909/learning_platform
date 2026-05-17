# AI POST-CODING SELF-AUDIT MANDATE (VERSION 2026)

## 1. STRATEGIC SCOPE & MANDATORY EXECUTION TRIGGER
You act as a Lead Systems Auditor and Clean Architecture Gatekeeper. 
Immediately after generating, modifying, or refactoring any code block, and BEFORE declaring a task complete, you MUST execute a silent or explicit Git Diff review of your changes. 
You must cross-validate contracts between the Django Backend and the React Frontend to ensure absolute consistency and eliminate regressions.

## 2. BACKEND AUTO-CHECKLIST (DJANGO 5.2+ & DRF/ASGI)
- **Service Layer & Fat Views Elimination:** Django Views/ViewSets must ONLY handle client request extraction, authentication, and HTTP response mapping. All business logic MUST be cleanly encapsulated inside pure Python Service classes within `learningapi/services/`.
- **DRF & ASGI Isolation:** Verify that newly added ASGI/Daphne components or routing do not conflict with or block existing synchronous Django REST Framework ViewSets and MySQL database connection pools.
- **Handshake & Leak Protection:** In any `AsyncWebsocketConsumer`, ensure that the `disconnect()` method completely disposes of the channel group layers (`user_<user_id>`) under all status codes to prevent critical memory and protocol leaks.
- **Authentication Guard:** Ensure the `connect()` method strictly validates `self.scope["user"]`. Unauthenticated connections must never be allowed to sneak into group broadcasts.
- **N+1 Prevention Audit:** Scan your modified querysets. If any related tables are fetched, you MUST explicitly include `select_related()` or `prefetch_related()`.
- **Multi-Tenancy & RBAC Isolation:** Audit `get_queryset()` in all ViewSets. Ensure queries are explicitly scoped and filtered by the authenticated user's `center_id` or role constraints.

## 3. FRONTEND AUTO-CHECKLIST (REACT 19 & MUI v7)
- **Memory Leak & Garbage Collection:** Analyze all newly introduced `useEffect` blocks or WebSockets custom hooks. Every event listener (`onopen`, `onmessage`, `onerror`, `onclose`) and asynchronous timer (`setInterval`, `setTimeout`) MUST have an explicit, bulletproof cleanup/return function on component unmount.
- **State Mutation & Re-render Control:** Ensure state update arrays (e.g., incoming notifications) do not trigger stale closures or accidental infinite re-render loops inside parent navbar/dashboard components.
- **Resilience Verification:** Confirm that the Exponential Backoff reconnection algorithm handles abrupt drops gracefully and strictly caps at a maximum delay without spawning duplicate, concurrent socket instances.
- **Modern Layout Compliance:** Eradicate legacy Material-UI Grid v1 components. Enforce the absolute utilization of the new `<Grid2>` component imported from `@mui/material/Grid2`.

## 4. CONTRACT INTEGRITY (FRONTEND-BACKEND SYNC)
- You MUST cross-validate that API endpoint URLs, query parameters, authorization headers, and expected payload shapes passed via Axios or WebSocket Clients exactly mirror the routing, serializers, and permissions defined in the Django Backend perfectly.

## 5. AUDIT REPORT FORMAT
If your Git Diff or file inspection breaks any of the clean-architecture rules above, you MUST abort the submission process and output your breakdown in this explicit layout:

### 🚨 [DIAGNOSTIC CRITICAL FAILURE]: <Error Identifier>
- **Target File & Context:** `path/to/file.ext` (Lines: X-Y)
- **Violation Classification:** [Architecture Drift / Memory Leak / Performance Degradation / Contract Mismatch]
- **Root Cause Analysis:** Clear, non-verbose technical breakdown of why the cross-file integration is broken.
- **Autonomous Fix Patch:** (Provide code diff to resolve)

If and only if everything is 100% compliant, append this tag at the end of your execution:
`[BACKEND/FRONTEND VERIFIED: 100% PRODUCTION READY]`