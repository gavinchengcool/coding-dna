import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 40 }).notNull(),
    email: varchar("email", { length: 255 }),
    displayName: varchar("display_name", { length: 100 }),
    avatarColor: varchar("avatar_color", { length: 7 }).default("#00D084"),
    role: varchar("role", { length: 20 }).default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username)]
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    deviceName: varchar("device_name", { length: 100 }),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("auth_tokens_hash_idx").on(t.tokenHash),
    index("auth_tokens_user_idx").on(t.userId),
  ]
);

export const deviceCodes = pgTable("device_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceCode: varchar("device_code", { length: 64 }).notNull(),
  userCode: varchar("user_code", { length: 8 }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  token: text("token"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    isPublic: integer("is_public").default(0).notNull(),
    summary: text("summary"),
    portrait: jsonb("portrait"),
    frameworkSentences: jsonb("framework_sentences"),
    activityMap: jsonb("activity_map"),
    behavioralFingerprint: jsonb("behavioral_fingerprint"),
    searchProfile: jsonb("search_profile"),
    searchVector: text("search_vector"),
    sessionsAnalyzed: integer("sessions_analyzed").default(0),
    totalTokens: integer("total_tokens").default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("profiles_user_idx").on(t.userId),
    index("profiles_public_idx").on(t.isPublic),
  ]
);

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .references(() => users.id)
      .notNull(),
    recipientId: uuid("recipient_id")
      .references(() => users.id)
      .notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("connections_requester_idx").on(t.requesterId),
    index("connections_recipient_idx").on(t.recipientId),
  ]
);

export const syncHistory = pgTable(
  "sync_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    sessionsAnalyzed: integer("sessions_analyzed").default(0),
    totalTokens: integer("total_tokens").default(0),
    clientVersion: varchar("client_version", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("sync_history_user_idx").on(t.userId)]
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type AuthToken = typeof authTokens.$inferSelect;
export type DeviceCode = typeof deviceCodes.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type SyncHistoryEntry = typeof syncHistory.$inferSelect;
