# Skill: Git Conventional Commits Specification

## Core Philosophy
Commit messages must be concise, accurate, and strictly follow the Conventional Commits specification. Never bundle multiple macro structural changes into a single, generic descriptive sentence.

## Format
Format template: `<type>(<scope>): <description>`

### Allowed Types:
- `feat`: A new feature introduced into the system.
- `fix`: A bug fix.
- `refactor`: A code change that neither fixes a bug nor adds a feature (e.g., isolating a service layer).
- `docs`: Documentation changes only (e.g., modifying markdown files, rules, or skills).
- `chore`: Maintenance tasks, updating configuration files (`.gitignore`, package updates).

### Strict Execution Rules:
1. **Imperative Mood**: Always use imperative, present-tense verbs at the start of the description (e.g., use `add` instead of `added`, `fix` instead of `fixing`, `refactor` instead of `refactored`).
2. **Length Constraints**: The subject line (first line) MUST NOT exceed 50 characters.
3. **Casing & Punctuation**: Do not capitalize the first letter of the description. Do not put a trailing period (`.`) at the end of the sentence.
4. **Scope Selection**: Use precise scopes like `payment`, `ai`, `auth`, or `config`.

## Examples
- **Good**: `refactor(payment): isolate vnpay logic into service`
- **Good**: `docs(ai): add core rules and refactor skills`
- **Bad**: `feat: establish architecture standards and implement VNPay service layer with comprehensive project documentation`