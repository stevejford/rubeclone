# Composio - AI Tool Marketplace

A modern marketplace platform for AI tools and integrations built with Next.js 14, TypeScript, Neon PostgreSQL, and Redis Cloud.

## Features

- 🚀 **Next.js 14** with App Router and Server Components
- 🎨 **shadcn/ui** components with Tailwind CSS
- 🗄️ **Neon PostgreSQL** database
- 🔴 **Redis Cloud** for caching and sessions
- 🔐 **NextAuth.js** authentication
- 🤖 **OpenAI** and **Composio** API integrations
- 📱 **Responsive design** with dark mode support
- ⚡ **TypeScript** for type safety
- 🎯 **Modern development** with ESLint and Prettier

## Quick Start

### Prerequisites

- Node.js 19+
- npm, yarn, or pnpm
- Neon PostgreSQL database
- Redis Cloud account (for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-tool-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
   - `OPENAI_API_KEY`: (Optional) Your OpenAI API key for AI features
   - `COMPOSIO_API_KEY`: (Optional) Your Composio API key for tool integrations

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database Management
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Run pending migrations
npm run db:seed      # Seed database with development data
npm run db:reset     # Reset database (drops all tables)
npm run db:validate  # Validate database schema
npm run db:status    # Check migration status

# Components
npm run components:add  # Add shadcn/ui components
```

## Project Structure

```
├── app/                 # Next.js 14 App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Homepage
│   ├── loading.tsx     # Loading UI
│   └── error.tsx       # Error boundary
├── components/         # Reusable components
│   └── ui/            # shadcn/ui components
├── lib/               # Utility functions
│   ├── db/            # Database layer
│   │   ├── schema.ts  # Database schema definitions
│   │   ├── queries.ts # Database query functions
│   │   ├── types.ts   # Database type definitions
│   │   └── seed-data.ts # Development seed data
│   ├── db.ts          # Database connection
│   ├── env.ts         # Environment validation
│   └── utils.ts       # Utility functions
├── scripts/           # Database and utility scripts
│   ├── generate-migration.ts # Generate migrations
│   ├── migrate.ts     # Run migrations
│   ├── seed-database.ts # Seed development data
│   ├── reset-database.ts # Reset database
│   └── validate-schema.ts # Validate schema
├── types/             # TypeScript definitions

```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `OPENAI_API_KEY` | OpenAI API key (for AI features) | ❌ |
| `COMPOSIO_API_KEY` | Composio API key (for tool integrations) | ❌ |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ❌ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ❌ |

## Database

This project uses **Neon PostgreSQL** with **Drizzle ORM** for type-safe database operations.

### Schema Overview

The database schema supports a multi-tenant workspace system with the following key entities:

- **Users**: User accounts with different plans (free, pro, company)
- **Workspaces**: Personal or company workspaces owned by users
- **Workspace Members**: Users who belong to workspaces with roles (admin, member)
- **Workspace Tools**: Tools enabled for specific workspaces
- **Tool Usage**: API call tracking per user/workspace/tool combination

### Database Setup

1. **Initial Setup**
   ```bash
   # Generate initial migration from schema
   npm run db:generate

   # Apply migrations to database
   npm run db:migrate

   # Seed with development data
   npm run db:seed
   ```

2. **Schema Changes**
   ```bash
   # After modifying lib/db/schema.ts
   npm run db:generate  # Generate migration
   npm run db:migrate   # Apply migration
   ```

3. **Development Reset**
   ```bash
   # Reset database and start fresh
   npm run db:reset
   npm run db:migrate
   npm run db:seed
   ```

### Database Scripts

| Command | Description |
|---------|-------------|
| `db:generate` | Generate migration from schema changes |
| `db:migrate` | Apply pending migrations |
| `db:seed` | Populate database with development data |
| `db:reset` | Drop all tables (destructive) |
| `db:validate` | Verify schema matches expectations |
| `db:status` | Check current migration status |

### Schema Relationships

```
Users (1:N) → Workspaces (owner_id)
Users (N:M) → Workspaces (via workspace_members)
Workspaces (1:N) → Workspace Tools
Workspaces (1:N) → Tool Usage
Users (1:N) → Tool Usage
```

### Troubleshooting

**Migration Issues**
- Ensure `DATABASE_URL` is correctly set
- Check network connectivity to Neon
- Verify database permissions

**Schema Validation Failures**
- Run `npm run db:validate` to identify issues
- Check for missing tables or columns
- Ensure foreign key constraints are properly set

**Seed Data Problems**
- Clear existing data before seeding
- Check for foreign key constraint violations
- Verify user IDs match between related tables

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API
- **Tool Integration**: Composio API
- **Deployment**: Vercel (recommended)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js 14 and modern web technologies.
