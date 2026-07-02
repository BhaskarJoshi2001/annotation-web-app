import { pgTable, text, uuid, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  taskType: text('task_type').notNull(), // 'detection' | 'segmentation' | 'classification' | 'keypoint'
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const labelClasses = pgTable('label_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  hotkey: text('hotkey'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  r2Key: text('r2_key').notNull(),
  width: integer('width'),
  height: integer('height'),
  sizeBytes: integer('size_bytes'), // verified via HeadObject at upload confirm; null on legacy rows
  status: text('status').notNull().default('unlabeled'), // 'unlabeled' | 'in_progress' | 'labeled'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const annotations = pgTable('annotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => labelClasses.id, { onDelete: 'set null' }),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const exports = pgTable('exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  format: text('format').notNull(), // 'coco' | 'yolo' | 'voc' | 'csv'
  r2Key: text('r2_key'),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'done' | 'error'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Inferred TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type LabelClass = typeof labelClasses.$inferSelect;
export type Image = typeof images.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type Export = typeof exports.$inferSelect;
