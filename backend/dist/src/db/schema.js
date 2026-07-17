"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobLogsRelations = exports.jobFilesRelations = exports.jobsRelations = exports.workersRelations = exports.usersRelations = exports.jobLogs = exports.jobFiles = exports.jobs = exports.workers = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.varchar)("username", { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    role: (0, pg_core_1.varchar)("role", { length: 50 }).default("USER").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.workers = (0, pg_core_1.pgTable)("workers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("OFFLINE").notNull(),
    lastHeartbeat: (0, pg_core_1.timestamp)("last_heartbeat").defaultNow().notNull(),
});
exports.jobs = (0, pg_core_1.pgTable)("jobs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    workerId: (0, pg_core_1.integer)("worker_id").references(() => exports.workers.id),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("WAITING").notNull(),
    prompt: (0, pg_core_1.text)("prompt").notNull(),
    negativePrompt: (0, pg_core_1.text)("negative_prompt"),
    model: (0, pg_core_1.varchar)("model", { length: 100 }).default("flow-ultra").notNull(),
    duration: (0, pg_core_1.varchar)("duration", { length: 50 }).default("5s").notNull(),
    aspectRatio: (0, pg_core_1.varchar)("aspect_ratio", { length: 50 }).default("16:9").notNull(),
    quantity: (0, pg_core_1.varchar)("quantity", { length: 10 }).default("1x").notNull(),
    tab: (0, pg_core_1.varchar)("tab", { length: 50 }).default("khung_hinh").notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 20 }).default("video").notNull(),
    priority: (0, pg_core_1.integer)("priority").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.jobFiles = (0, pg_core_1.pgTable)("job_files", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    jobId: (0, pg_core_1.integer)("job_id").notNull().references(() => exports.jobs.id, { onDelete: "cascade" }),
    fileType: (0, pg_core_1.varchar)("file_type", { length: 50 }).notNull(),
    url: (0, pg_core_1.text)("url").notNull(),
    checksum: (0, pg_core_1.text)("checksum"),
});
exports.jobLogs = (0, pg_core_1.pgTable)("job_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    jobId: (0, pg_core_1.integer)("job_id").notNull().references(() => exports.jobs.id, { onDelete: "cascade" }),
    message: (0, pg_core_1.text)("message").notNull(),
    level: (0, pg_core_1.varchar)("level", { length: 50 }).default("INFO").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    jobs: many(exports.jobs),
}));
exports.workersRelations = (0, drizzle_orm_1.relations)(exports.workers, ({ many }) => ({
    jobs: many(exports.jobs),
}));
exports.jobsRelations = (0, drizzle_orm_1.relations)(exports.jobs, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.jobs.userId],
        references: [exports.users.id],
    }),
    worker: one(exports.workers, {
        fields: [exports.jobs.workerId],
        references: [exports.workers.id],
    }),
    files: many(exports.jobFiles),
    logs: many(exports.jobLogs),
}));
exports.jobFilesRelations = (0, drizzle_orm_1.relations)(exports.jobFiles, ({ one }) => ({
    job: one(exports.jobs, {
        fields: [exports.jobFiles.jobId],
        references: [exports.jobs.id],
    }),
}));
exports.jobLogsRelations = (0, drizzle_orm_1.relations)(exports.jobLogs, ({ one }) => ({
    job: one(exports.jobs, {
        fields: [exports.jobLogs.jobId],
        references: [exports.jobs.id],
    }),
}));
//# sourceMappingURL=schema.js.map