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

const dateSchema = z.preprocess((arg) => {
  if (typeof arg === "string" && arg === "") return null;
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return arg;
}, z.date().nullable().optional());

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().nullable().optional(),
  area: z.preprocess((v) => (v === "" || v === undefined || v === null ? null : v), taskAreaSchema.nullable().optional()),
  
  // FIX: Removed .uuid()
  company_id: z.preprocess((v) => (v === "" || v === undefined || v === null ? null : v), z.string().nullable().optional()),
  
  priority: taskPrioritySchema.default("medium"),
  
  // FIX: Removed .uuid()
  assignee_id: z.preprocess((v) => (v === "" || v === "unassigned" || v === undefined || v === null ? null : v), z.string().nullable().optional()),
  
  due_date: dateSchema,
  start_date: dateSchema,
  estimated_hours: z.preprocess((v) => {
    if (v === "" || v === undefined || v === null) return null;
    return typeof v === "string" ? parseFloat(v) : v;
  }, z.number().min(0).nullable().optional()),
  recurrence: z.preprocess((v) => (v === "" || v === undefined || v === null ? null : v), taskRecurrenceSchema.optional()),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  // FIX: Removed .uuid()
  id: z.string(),
  status: taskStatusSchema.optional(),
  completed_at: dateSchema,
});

export const taskQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)),
  search: z.string().optional(),
  status: taskStatusSchema.optional().or(z.literal("all")).transform(v => v === "all" ? undefined : v),
  priority: taskPrioritySchema.optional().or(z.literal("all")).transform(v => v === "all" ? undefined : v),
  area: taskAreaSchema.optional().or(z.literal("all")).transform(v => v === "all" ? undefined : v),
  
  // FIX: Removed .uuid()
  company_id: z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.string().optional()),
  assignee_id: z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.string().optional()),
  created_by: z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.string().optional()),
  
  sortBy: z.enum(["created_at", "due_date", "priority"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;