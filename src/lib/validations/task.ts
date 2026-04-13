import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["not_started", "in_progress", "review", "completed"]);
export const taskAreaSchema = z.enum([
  "Production",
  "Quality",
  "Warehouse",
  "Procurement",
  "HR",
  "Admin",
  "Maintenance",
  "Finance",
]);
export const taskRecurrenceSchema = z.enum(["daily", "weekly", "monthly", "yearly"]).nullable();

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().nullable().optional(),
  area: taskAreaSchema.nullable().optional(),
  priority: taskPrioritySchema.default("medium"),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  start_date: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  estimated_hours: z.number().min(0).nullable().optional().or(z.string().transform(v => v ? parseFloat(v) : null).nullable().optional()),
  recurrence: taskRecurrenceSchema.optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
  status: taskStatusSchema.optional(),
  completed_at: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
});

export const taskQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)),
  search: z.string().optional(),
  status: taskStatusSchema.optional().or(z.literal("all")).transform(v => v === "all" ? undefined : v),
  priority: taskPrioritySchema.optional().or(z.literal("all")).transform(v => v === "all" ? undefined : v),
  area: taskAreaSchema.optional().or(z.literal("all")).transform(v => v === "all" ? undefined : v),
  assignee_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  sortBy: z.enum(["created_at", "due_date", "priority"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
