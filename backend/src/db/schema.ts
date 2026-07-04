import { pgTable, serial, text, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("USER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("OFFLINE").notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  workerId: integer("worker_id").references(() => workers.id),
  status: varchar("status", { length: 50 }).default("WAITING").notNull(),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  model: varchar("model", { length: 100 }).default("flow-ultra").notNull(),
  duration: varchar("duration", { length: 50 }).default("5s").notNull(),
  aspectRatio: varchar("aspect_ratio", { length: 50 }).default("16:9").notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobFiles = pgTable("job_files", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  url: text("url").notNull(),
  checksum: text("checksum"),
});

export const jobLogs = pgTable("job_logs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  level: varchar("level", { length: 50 }).default("INFO").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
}));

export const workersRelations = relations(workers, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  worker: one(workers, {
    fields: [jobs.workerId],
    references: [workers.id],
  }),
  files: many(jobFiles),
  logs: many(jobLogs),
}));

export const jobFilesRelations = relations(jobFiles, ({ one }) => ({
  job: one(jobs, {
    fields: [jobFiles.jobId],
    references: [jobs.id],
  }),
}));

export const jobLogsRelations = relations(jobLogs, ({ one }) => ({
  job: one(jobs, {
    fields: [jobLogs.jobId],
    references: [jobs.id],
  }),
}));
