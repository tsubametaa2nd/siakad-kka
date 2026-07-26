// Fitur: Skema Tabel Drizzle ORM (Supabase PostgreSQL)
import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  identifier: text("identifier").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  academicYear: text("academic_year").notNull(),
  homeroomTeacherId: uuid("homeroom_teacher_id").notNull().references(() => profiles.id),
  spreadsheetId: text("spreadsheet_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teachingAssignments = pgTable("teaching_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
});

export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
}, (table) => [
  uniqueIndex("enrollments_student_class_idx").on(table.studentId, table.classId)
]);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  leaderId: uuid("leader_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  maxMembers: integer("max_members").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("group_members_student_class_idx").on(table.studentId, table.classId)
]);

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  credentials: many(credentials),
  enrollments: many(enrollments),
  groupMembers: many(groupMembers),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  profile: one(profiles, { fields: [credentials.profileId], references: [profiles.id] }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  homeroomTeacher: one(profiles, { fields: [classes.homeroomTeacherId], references: [profiles.id] }),
  enrollments: many(enrollments),
  groups: many(groups),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(profiles, { fields: [enrollments.studentId], references: [profiles.id] }),
  class: one(classes, { fields: [enrollments.classId], references: [classes.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  class: one(classes, { fields: [groups.classId], references: [classes.id] }),
  leader: one(profiles, { fields: [groups.leaderId], references: [profiles.id] }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  student: one(profiles, { fields: [groupMembers.studentId], references: [profiles.id] }),
}));
