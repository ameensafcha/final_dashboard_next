# Project Rules

## Database Migrations

- **Always use `prisma migrate dev`** for schema changes — never use `prisma db push`
- Migration command: `npx prisma migrate dev --name "<migration-name>"`
- If the command requires interactive input, tell the user to run it themselves in their terminal
- Never use `--accept-data-loss` or `db push` flags
