# Rawaq | رواق — Premium Islamic Fashion & Perfumes

A full-featured e-commerce platform for Islamic clothing and Arabic perfumes, built with
Next.js 16, TypeScript, Tailwind CSS v4, Prisma, and PostgreSQL.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL 15+ via Prisma ORM
- **i18n**: next-intl (English + Arabic/RTL)
- **Auth**: Custom JWT + httpOnly cookies

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local) **or** a managed Postgres URL (Neon, Supabase, Railway, etc.)
- npm 10+

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url> rawaq
cd rawaq
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rawaq"
JWT_SECRET="your-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed with sample data (categories, products, coupon)
npx prisma db seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) for English
or [http://localhost:3000/ar](http://localhost:3000/ar) for Arabic (RTL).

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |
| `npx prisma migrate dev` | Apply schema changes as a new migration |
| `npx prisma db seed` | Seed the database |

---

## Project Structure

See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for the full folder structure and all
architectural decisions.

---

## Environment Variables

See [.env.example](./.env.example) for the complete list of required and optional
environment variables with setup instructions for each.

---

## i18n / Localization

The app supports English (`/en`) and Arabic (`/ar`) with full RTL layout. Translation
strings live in `messages/en.json` and `messages/ar.json`.

---

## License

Proprietary — © Rawaq. All rights reserved.
