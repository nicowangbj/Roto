# Roto School Deployment

This guide deploys the school version as a separate Vercel project from the personal version.

## Goal

- Personal site remains on `https://roto-research.vercel.app`
- School site gets its own Vercel URL, for example `https://roto-school.vercel.app`
- Both sites can use the same GitHub repository
- The school site should use `NEXT_PUBLIC_APP_VARIANT=school`
- Prefer a separate Turso database for the school site so teacher/class data is isolated from the personal product

## 1. Create a School Turso Database

Create a new Turso/libSQL database for the school version, then copy:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## 2. Apply Database Migrations

From the project root, run:

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx prisma/push-to-turso.ts
```

Optional seed for AI strategies/demo data:

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx prisma/seed.ts
```

## 3. Create a Second Vercel Project

In Vercel:

1. Add New Project
2. Import the same GitHub repository
3. Name it something like `roto-school`
4. Set the root directory to `research-flow` if Vercel asks for it
5. Keep framework as Next.js

## 4. Set School Project Environment Variables

In the new Vercel project, add:

```env
NEXT_PUBLIC_APP_VARIANT=school
NEXT_PUBLIC_PERSONAL_SITE_URL=https://roto-research.vercel.app
SESSION_SECRET=<generate with openssl rand -base64 32>
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
GEMINI_API_KEY=<same Gemini key if available>
ENABLE_ADMIN=false
ADMIN_ONLY=false
ADMIN_EMAILS=
```

Optional, after choosing the school URL:

```env
NEXT_PUBLIC_APP_URL=https://your-school-site.vercel.app
```

## 5. Deploy

Trigger a deployment. When it is ready, open:

```text
https://your-school-site.vercel.app/en
https://your-school-site.vercel.app/en/school
https://your-school-site.vercel.app/en/school/teacher
https://your-school-site.vercel.app/en/school/student
https://your-school-site.vercel.app/api/health/auth
```

The health endpoint should return:

```json
{
  "ok": true,
  "appVariant": "school",
  "databaseUrl": "libsql",
  "hasDatabaseToken": true,
  "hasSessionSecret": true
}
```

## 6. Link Personal Site to School Site

After the school site URL is known, add this to the personal Vercel project:

```env
NEXT_PUBLIC_SCHOOL_SITE_URL=https://your-school-site.vercel.app
```

Redeploy the personal project after adding it.
