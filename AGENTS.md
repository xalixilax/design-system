# Agens guidelines

## Development guidelines

- you **MUST** use `pnpm` avec any command insite this repository.
- You **SHOULD** use the package name when yo need to execute a command inside a package. (Ex.: `pnpm --filter web dev`)
- You **MUST** run `pnpm ai` after every changes to validate your work

## Standard

- File case **MUST** be `kebab-case`
- Every files **MUST** use typescript
- You **SHOULD** never use `as` for type assertion
- you **MUST** never use `any` for type definition
- i18n key **MUST** be in `SCREAMING_SNAKE_CASE`
- Every string directed to a user **MUST** be translated using i18n

## Task Management

- You **SHOULD** use `dex` skill for task coordination. See `.github/skills/dex/SKILL.md`
- You **SHOULD** use `dex-plan` skill for creating tasks from planning docs. See `.github/skills/dex-plan/SKILL.md`
