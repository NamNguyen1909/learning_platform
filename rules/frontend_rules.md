# React 19 & Material-UI 7 Frontend Rules

## UI Components & Layouts
- Use Material-UI (MUI) v7 as the primary core UI kit.
- Grid System: Always use MUI Grid v2 (`import Grid from '@mui/material/Grid2'`), NEVER use Grid v1.
- Page Wrappers: Wrap standard layout contents inside a `<Container maxWidth="lg">`.

## Responsiveness & Feedback
- Layouts must be 100% responsive. Use breakpoints (`xs`, `sm`, `md`, `lg`) on Box and Grid components.
- User Feedback: Always handle API response states with proper loading indicators and show messages via `Snackbar` / `Alert` for success or error feedback.

## State Management Architecture
- For local component UI logic: Use standard React hooks (`useState`).
- For global lightweight states (Theme, Current Authenticated User): Use React Context API.
- For business data (Cart, Course Progress): Use Redux Toolkit or Zustand.