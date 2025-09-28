import { pgTable, serial, varchar, text, timestamp, boolean, jsonb, integer, index, date, uniqueIndex } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  image: text("image"),
  password: text("password"),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  plan: varchar("plan", { length: 20 }).default("free").notNull(), // 'free', 'pro', 'company'
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index("accounts_user_idx").on(table.userId),
  providerAccountUnique: uniqueIndex("accounts_provider_account_unique").on(table.provider, table.providerAccountId),
}))

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).default("personal").notNull(), // 'personal' or 'company'
  owner_id: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ownerIdx: index("workspaces_owner_idx").on(table.owner_id),
  typeIdx: index("workspaces_type_idx").on(table.type),
}))

export const workspaceMembers = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspace_id: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).default("member").notNull(), // 'admin' or 'member'
  joined_at: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("workspace_members_workspace_idx").on(table.workspace_id),
  userIdx: index("workspace_members_user_idx").on(table.user_id),
  uniqueMember: uniqueIndex("workspace_members_unique_idx").on(table.workspace_id, table.user_id),
}))

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  provider: varchar("provider", { length: 100 }),
  config: jsonb("config").default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const workspaceTools = pgTable("workspace_tools", {
  id: serial("id").primaryKey(),
  workspace_id: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  // tool_slug intentionally references external provider slugs and is not FK-constrained to the tools table
  tool_slug: varchar("tool_slug", { length: 100 }).notNull(),
  enabled_by: integer("enabled_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  enabled_at: timestamp("enabled_at", { withTimezone: true }).defaultNow().notNull(),
  is_enabled: boolean("is_enabled").default(true).notNull(),
  connection_id: varchar("connection_id", { length: 255 }), // Composio connection identifier
  config: jsonb("config").default({}), // Includes connection metadata: status, lastSync, tokenExpiry
}, (table) => ({
  workspaceIdx: index("workspace_tools_workspace_idx").on(table.workspace_id),
  toolSlugIdx: index("workspace_tools_slug_idx").on(table.tool_slug),
  connectionIdx: index("workspace_tools_connection_idx").on(table.connection_id),
  uniqueTool: uniqueIndex("workspace_tools_unique_idx").on(table.workspace_id, table.tool_slug),
}))

export const toolUsage = pgTable("tool_usage", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspace_id: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  tool_slug: varchar("tool_slug", { length: 100 }).notNull(),
  usage_date: date("usage_date").notNull(),
  api_calls: integer("api_calls").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("tool_usage_user_idx").on(table.user_id),
  workspaceIdx: index("tool_usage_workspace_idx").on(table.workspace_id),
  toolSlugIdx: index("tool_usage_slug_idx").on(table.tool_slug),
  dateIdx: index("tool_usage_date_idx").on(table.usage_date),
  uniqueUsage: uniqueIndex("tool_usage_unique_idx").on(table.user_id, table.workspace_id, table.tool_slug, table.usage_date),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert
export type Tool = typeof tools.$inferSelect
export type NewTool = typeof tools.$inferInsert
export type WorkspaceTool = typeof workspaceTools.$inferSelect
export type NewWorkspaceTool = typeof workspaceTools.$inferInsert
export type ToolUsage = typeof toolUsage.$inferSelect
export type NewToolUsage = typeof toolUsage.$inferInsert
