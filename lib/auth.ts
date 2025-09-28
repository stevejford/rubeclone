import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { getEnv } from "@/lib/env"
import { db } from "@/lib/db"
import { users, accounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
// NextAuth configuration for AI Tool Marketplace

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: "user" | "admin"
      plan: string
      createdAt: Date
      updatedAt: Date
    }
  }
  interface User {
    id: string
    email: string
    name: string | null
    image: string | null
    role: "user" | "admin"
    plan: string
    createdAt: Date
    updatedAt: Date
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string | null
    image: string | null
    role: "user" | "admin"
    plan: string
    createdAt: Date
    updatedAt: Date
  }
}

export function getAuthOptions(): NextAuthOptions {
  const env = getEnv();

  return {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email.toLowerCase().trim()))
            .limit(1)

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as "user" | "admin",
            plan: user.plan || "free",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
    // Only include OAuth providers if credentials are configured
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
      })
    ] : []),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true
      }

      if (account?.provider === "github" || account?.provider === "google") {
        try {
          // Check if user exists by email
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1)

          let dbUser
          if (existingUsers.length === 0) {
            // Create new user
            const [newUser] = await db.insert(users).values({
              email: user.email!,
              name: user.name,
              image: user.image,
              role: "user",
              plan: "free",
              emailVerified: new Date(),
            }).returning()
            dbUser = newUser
          } else {
            // Update existing user
            const [updatedUser] = await db
              .update(users)
              .set({
                name: user.name,
                image: user.image,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUsers[0]!.id))
              .returning()
            dbUser = updatedUser
          }

          // Check if this OAuth account is already linked
          const existingAccounts = await db
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId!)
              )
            )
            .limit(1)

          // Link the account if not already linked and we have a user
          if (existingAccounts.length === 0 && dbUser) {
            await db.insert(accounts).values({
              userId: dbUser.id,
              type: account.type!,
              provider: account.provider,
              providerAccountId: account.providerAccountId!,
              refreshToken: account.refresh_token,
              accessToken: account.access_token,
              expiresAt: account.expires_at,
              tokenType: account.token_type,
              scope: account.scope,
              idToken: account.id_token,
              sessionState: account.session_state,
            })
          }

          // Store the database user data in the user object for JWT callback
          if (dbUser) {
            user.id = dbUser.id.toString()
            user.role = dbUser.role as "user" | "admin"
            user.plan = dbUser.plan
            user.createdAt = dbUser.createdAt
            user.updatedAt = dbUser.updatedAt
          }

          return true
        } catch (error) {
          console.error("OAuth sign-in error:", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in, add user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.role = user.role
        token.plan = user.plan || "free"
        token.createdAt = user.createdAt
        token.updatedAt = user.updatedAt
      }

      // Fetch fresh user data from database to get role and plan
      // This ensures we have the latest user information in the token
      if (token.email && (!token.role || trigger === "update")) {
        try {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, token.email))
            .limit(1)

          if (dbUser) {
            token.id = dbUser.id.toString()
            token.role = dbUser.role as "user" | "admin"
            token.createdAt = dbUser.createdAt
            token.updatedAt = dbUser.updatedAt
            // Add plan information to token for middleware checks
            token.plan = dbUser.plan || "free"
          }
        } catch (error) {
          console.error("JWT callback error:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        // Use data from JWT token instead of fetching from database
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          image: token.image,
          role: token.role,
          plan: token.plan,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
        }
      }
      return session
    },
  },
  }
}
