import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { z } from "zod";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
// Load .env from the main project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found. Make sure .env file exists in the project root.");
    process.exit(1);
}
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const CATEGORIES = [
    "Safcha — Product & SFDA",
    "Packaging & Design",
    "B2B & Wholesale",
    "Nawafith — Operations",
    "Nawafith — Marketing & Sales",
    "Safcha — Marketing & Content",
    "E-commerce & Online",
    "Office & Operations",
    "Hiring & Employees",
    "Inventory & Production",
    "Events, Expo & Export",
    "Misc / Leads",
    "all"
];
const TIERS = [
    "T1 Strategic",
    "T2 Quick Win",
    "SOP",
    "Recurring",
    "Long-term",
    "None"
];
const STATUSES = [
    "not_started",
    "in_progress",
    "review",
    "completed",
    "active",
    "blocked",
    "recurring",
    "sop",
    "parked",
    "needs_verification",
    "all"
];
function createServer() {
    const server = new McpServer({
        name: "task-manager",
        version: "1.1.0",
    });
    // ─────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────
    function formatTask(t) {
        const lines = [
            `📌 ${t.title} [${t.id}]`,
            `   Status   : ${t.status}`,
            `   Priority : ${t.priority}`,
            t.tier ? `   Tier     : ${t.tier}` : null,
            t.area ? `   Category : ${t.area.name}` : null,
            t.company ? `   Company  : ${t.company.name}` : null,
            t.assignee ? `   Assignee : ${t.assignee.name}` : null,
            t.due_date ? `   Due      : ${new Date(t.due_date).toLocaleDateString("en-PK")}` : null,
            t.start_date ? `   Start    : ${new Date(t.start_date).toLocaleDateString("en-PK")}` : null,
            t.description ? `   Desc     : ${t.description}` : null,
            t.subtasks?.length ? `   Subtasks : ${t.subtasks.filter((s) => s.is_completed).length}/${t.subtasks.length} done` : null,
        ];
        return lines.filter(Boolean).join("\n");
    }
    // ─────────────────────────────────────────────
    // TOOL: list_tasks
    // ─────────────────────────────────────────────
    server.tool("list_tasks", "Tasks ki list dikhao — filter kar sakte ho status, priority, category, tier, search se", {
        search: z.string().optional().describe("Title ya description mein search"),
        status: z.enum(STATUSES).optional().describe("Task ka status"),
        priority: z.enum(["low", "medium", "high", "urgent", "all"]).optional().describe("Priority level"),
        category: z.enum(CATEGORIES).optional().describe("Task category (Area)"),
        tier: z.enum(TIERS).optional().describe("Task tier"),
        assignee_name: z.string().optional().describe("Assignee ka naam (partial bhi chalega)"),
        overdue_only: z.boolean().optional().describe("Sirf overdue tasks"),
        limit: z.number().optional().default(20).describe("Kitni tasks dikhani hain (default 20)"),
    }, async (args) => {
        const where = {};
        if (args.search) {
            where.OR = [
                { title: { contains: args.search, mode: "insensitive" } },
                { description: { contains: args.search, mode: "insensitive" } },
            ];
        }
        if (args.status && args.status !== "all")
            where.status = args.status;
        if (args.priority && args.priority !== "all")
            where.priority = args.priority;
        if (args.tier && args.tier !== "None")
            where.tier = args.tier;
        if (args.category && args.category !== "all") {
            const area = await prisma.area.findFirst({
                where: { name: { equals: args.category, mode: "insensitive" } },
            });
            if (area)
                where.area_id = area.id;
        }
        if (args.assignee_name) {
            where.assignee = { name: { contains: args.assignee_name, mode: "insensitive" } };
        }
        if (args.overdue_only) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.due_date = { lt: today };
            where.status = { not: "completed" };
        }
        const tasks = await prisma.tasks.findMany({
            where,
            take: args.limit ?? 20,
            orderBy: { created_at: "desc" },
            include: {
                company: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
                subtasks: true,
            },
        });
        if (tasks.length === 0) {
            return { content: [{ type: "text", text: "Koi task nahi mili is filter ke saath." }] };
        }
        const text = `${tasks.length} task(s) mili:\n\n` + tasks.map(formatTask).join("\n\n");
        return { content: [{ type: "text", text }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: get_task
    // ─────────────────────────────────────────────
    server.tool("get_task", "Kisi ek task ki poori detail dikhao — subtasks, comments, time logs ke saath", { task_id: z.string().describe("Task ka ID") }, async ({ task_id }) => {
        const task = await prisma.tasks.findUnique({
            where: { id: task_id },
            include: {
                company: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
                subtasks: { orderBy: { created_at: "asc" } },
                comments: {
                    include: { employee: { select: { id: true, name: true } } },
                    orderBy: { created_at: "desc" },
                    take: 5,
                },
                time_logs: {
                    include: { employee: { select: { id: true, name: true } } },
                    orderBy: { created_at: "desc" },
                    take: 5,
                },
            },
        });
        if (!task)
            return { content: [{ type: "text", text: `Task ID "${task_id}" nahi mili.` }] };
        const subtaskLines = task.subtasks.length
            ? task.subtasks.map((s) => `   ${s.is_completed ? "✅" : "⬜"} ${s.title} [${s.id}]`).join("\n")
            : "   Koi subtask nahi";
        const commentLines = task.comments.length
            ? task.comments.map((c) => `   💬 ${c.employee.name}: ${c.content}`).join("\n")
            : "   Koi comment nahi";
        const timeLines = task.time_logs.length
            ? task.time_logs.map((l) => `   ⏱ ${l.employee.name}: ${l.hours}h${l.notes ? ` — ${l.notes}` : ""}`).join("\n")
            : "   Koi time log nahi";
        const totalHours = task.time_logs.reduce((sum, l) => sum + l.hours, 0);
        const text = [
            formatTask(task),
            `   Created  : ${new Date(task.created_at).toLocaleDateString("en-PK")}`,
            task.estimated_hours ? `   Est Hrs  : ${task.estimated_hours}h (logged: ${totalHours}h)` : null,
            task.recurrence ? `   Recurs   : ${task.recurrence}` : null,
            `\n📋 Subtasks:\n${subtaskLines}`,
            `\n💬 Comments (last 5):\n${commentLines}`,
            `\n⏱ Time Logs (last 5):\n${timeLines}`,
        ].filter(Boolean).join("\n");
        return { content: [{ type: "text", text }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: create_task
    // ─────────────────────────────────────────────
    server.tool("create_task", "Nayi task banao", {
        title: z.string().min(1).max(255).describe("Task ka title — zarori hai"),
        description: z.string().optional().describe("Task ki description"),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
        status: z.enum(STATUSES).optional().default("not_started"),
        category: z.enum(CATEGORIES).optional().describe("Task category (Area)"),
        tier: z.enum(TIERS).optional().describe("Task tier"),
        due_date: z.string().optional().describe("Due date — format: YYYY-MM-DD"),
        start_date: z.string().optional().describe("Start date — format: YYYY-MM-DD"),
        assignee_name: z.string().optional().describe("Assignee ka naam — partial bhi chalega"),
        company_name: z.string().optional().describe("Company ka naam — partial bhi chalega"),
        estimated_hours: z.number().optional().describe("Estimated hours"),
        created_by_name: z.string().describe("Kis employee ke naam se banani hai task — zarori hai"),
    }, async (args) => {
        // Creator dhundhna
        const creator = await prisma.employee.findFirst({
            where: { name: { contains: args.created_by_name, mode: "insensitive" }, is_active: true },
        });
        if (!creator)
            return { content: [{ type: "text", text: `Employee "${args.created_by_name}" nahi mila. Pehle list_employees se naam check karo.` }] };
        // Assignee dhundhna (optional)
        let assignee_id = null;
        if (args.assignee_name) {
            const assignee = await prisma.employee.findFirst({
                where: { name: { contains: args.assignee_name, mode: "insensitive" }, is_active: true },
            });
            if (!assignee)
                return { content: [{ type: "text", text: `Assignee "${args.assignee_name}" nahi mila.` }] };
            assignee_id = assignee.id;
        }
        // Company dhundhna (optional)
        let company_id = null;
        if (args.company_name) {
            const company = await prisma.companies.findFirst({
                where: { name: { contains: args.company_name, mode: "insensitive" } },
            });
            if (!company)
                return { content: [{ type: "text", text: `Company "${args.company_name}" nahi mili.` }] };
            company_id = company.id;
        }
        // Find area by name and get area_id
        let area_id = null;
        if (args.category && args.category !== "all") {
            const area = await prisma.area.findFirst({
                where: { name: { equals: args.category, mode: "insensitive" } },
            });
            if (area)
                area_id = area.id;
        }
        const task = await prisma.tasks.create({
            data: {
                title: args.title,
                description: args.description ?? null,
                priority: args.priority ?? "medium",
                status: args.status === "all" ? "not_started" : (args.status ?? "not_started"),
                tier: args.tier === "None" ? null : (args.tier ?? null),
                area_id: area_id,
                created_by: creator.id,
                assignee_id,
                company_id,
                due_date: args.due_date ? new Date(args.due_date) : null,
                start_date: args.start_date ? new Date(args.start_date) : null,
                estimated_hours: args.estimated_hours ?? null,
            },
            include: {
                company: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
                subtasks: true,
            },
        });
        return { content: [{ type: "text", text: `✅ Task bana di!\n\n${formatTask(task)}` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: update_task
    // ─────────────────────────────────────────────
    server.tool("update_task", "Existing task ko update karo — koi bhi field badal sakte ho", {
        task_id: z.string().describe("Task ka ID — zarori hai"),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(STATUSES).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        category: z.enum(CATEGORIES).optional().describe("Task category (Area)"),
        tier: z.enum(TIERS).optional(),
        due_date: z.string().optional().describe("Format: YYYY-MM-DD, ya 'null' hatane ke liye"),
        start_date: z.string().optional().describe("Format: YYYY-MM-DD, ya 'null' hatane ke liye"),
        assignee_name: z.string().optional().describe("Nayi assignee ka naam"),
        estimated_hours: z.number().optional(),
    }, async (args) => {
        const existing = await prisma.tasks.findUnique({ where: { id: args.task_id } });
        if (!existing)
            return { content: [{ type: "text", text: `Task ID "${args.task_id}" nahi mili.` }] };
        const updateData = {};
        if (args.title)
            updateData.title = args.title;
        if (args.description !== undefined)
            updateData.description = args.description;
        if (args.status && args.status !== "all")
            updateData.status = args.status;
        if (args.priority)
            updateData.priority = args.priority;
        if (args.tier)
            updateData.tier = args.tier === "None" ? null : args.tier;
        if (args.category && args.category !== "all") {
            const area = await prisma.area.findFirst({
                where: { name: { equals: args.category, mode: "insensitive" } },
            });
            if (area)
                updateData.area_id = area.id;
        }
        if (args.estimated_hours !== undefined)
            updateData.estimated_hours = args.estimated_hours;
        if (args.due_date !== undefined)
            updateData.due_date = args.due_date === "null" ? null : new Date(args.due_date);
        if (args.start_date !== undefined)
            updateData.start_date = args.start_date === "null" ? null : new Date(args.start_date);
        // Assignee update
        if (args.assignee_name) {
            const assignee = await prisma.employee.findFirst({
                where: { name: { contains: args.assignee_name, mode: "insensitive" }, is_active: true },
            });
            if (!assignee)
                return { content: [{ type: "text", text: `Assignee "${args.assignee_name}" nahi mila.` }] };
            updateData.assignee_id = assignee.id;
        }
        // completed_at set karo agar status complete ho raha hai
        if (args.status === "completed" && existing.status !== "completed") {
            updateData.completed_at = new Date();
        }
        const task = await prisma.tasks.update({
            where: { id: args.task_id },
            data: updateData,
            include: {
                company: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
                subtasks: true,
            },
        });
        return { content: [{ type: "text", text: `✅ Task update ho gayi!\n\n${formatTask(task)}` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: delete_task
    // ─────────────────────────────────────────────
    server.tool("delete_task", "Task delete karo (permanent — wapas nahi aayegi)", { task_id: z.string().describe("Task ka ID") }, async ({ task_id }) => {
        const existing = await prisma.tasks.findUnique({ where: { id: task_id }, select: { id: true, title: true } });
        if (!existing)
            return { content: [{ type: "text", text: `Task ID "${task_id}" nahi mili.` }] };
        await prisma.tasks.delete({ where: { id: task_id } });
        return { content: [{ type: "text", text: `🗑️ Task "${existing.title}" delete ho gayi.` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: add_subtask
    // ─────────────────────────────────────────────
    server.tool("add_subtask", "Task mein subtask add karo", {
        task_id: z.string().describe("Parent task ka ID"),
        title: z.string().min(1).describe("Subtask ka title"),
    }, async ({ task_id, title }) => {
        const task = await prisma.tasks.findUnique({ where: { id: task_id }, select: { id: true, title: true } });
        if (!task)
            return { content: [{ type: "text", text: `Task ID "${task_id}" nahi mili.` }] };
        const subtask = await prisma.subtasks.create({
            data: { task_id, title, is_completed: false },
        });
        return { content: [{ type: "text", text: `✅ Subtask add ho gayi!\n   "${subtask.title}" [${subtask.id}]\n   Task: "${task.title}"` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: complete_subtask
    // ─────────────────────────────────────────────
    server.tool("complete_subtask", "Subtask complete ya incomplete mark karo", {
        subtask_id: z.string().describe("Subtask ka ID"),
        is_completed: z.boolean().optional().default(true),
    }, async ({ subtask_id, is_completed }) => {
        const existing = await prisma.subtasks.findUnique({ where: { id: subtask_id } });
        if (!existing)
            return { content: [{ type: "text", text: `Subtask ID "${subtask_id}" nahi mili.` }] };
        await prisma.subtasks.update({ where: { id: subtask_id }, data: { is_completed: is_completed ?? true } });
        const status = (is_completed ?? true) ? "✅ Complete" : "⬜ Incomplete";
        return { content: [{ type: "text", text: `${status} mark ho gayi: "${existing.title}"` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: list_employees
    // ─────────────────────────────────────────────
    server.tool("list_employees", "Saare employees ki list dikhao — task assign karne ke liye naam aur ID chahiye", { active_only: z.boolean().optional().default(true) }, async ({ active_only }) => {
        const employees = await prisma.employee.findMany({
            where: active_only ? { is_active: true } : {},
            orderBy: { name: "asc" },
            include: { role: { select: { name: true } } },
        });
        if (employees.length === 0)
            return { content: [{ type: "text", text: "Koi employee nahi mila." }] };
        const text = employees.map((e) => `👤 ${e.name} [${e.id}]${e.role ? ` — ${e.role.name}` : ""}`).join("\n");
        return { content: [{ type: "text", text: `${employees.length} employee(s):\n\n${text}` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: list_companies
    // ─────────────────────────────────────────────
    server.tool("list_companies", "Saari companies ki list dikhao", { active_only: z.boolean().optional().default(true) }, async ({ active_only }) => {
        const companies = await prisma.companies.findMany({
            where: active_only ? { is_active: true } : {},
            orderBy: { name: "asc" },
        });
        if (companies.length === 0)
            return { content: [{ type: "text", text: "Koi company nahi mili." }] };
        const text = companies.map((c) => `🏢 ${c.name} [${c.id}]`).join("\n");
        return { content: [{ type: "text", text: `${companies.length} compan(y/ies):\n\n${text}` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: task_summary
    // ─────────────────────────────────────────────
    server.tool("task_summary", "Tasks ka overview — kitni pending, overdue, complete hain", {}, async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [total, completed, inProgress, overdue, notStarted, review] = await Promise.all([
            prisma.tasks.count(),
            prisma.tasks.count({ where: { status: "completed" } }),
            prisma.tasks.count({ where: { status: "in_progress" } }),
            prisma.tasks.count({ where: { due_date: { lt: today }, status: { not: "completed" } } }),
            prisma.tasks.count({ where: { status: "not_started" } }),
            prisma.tasks.count({ where: { status: "review" } }),
        ]);
        const text = [
            "📊 Task Summary",
            `   Total      : ${total}`,
            `   ✅ Complete : ${completed}`,
            `   🔄 Progress : ${inProgress}`,
            `   👀 Review   : ${review}`,
            `   ⬜ Not Start: ${notStarted}`,
            `   🔴 Overdue  : ${overdue}`,
        ].join("\n");
        return { content: [{ type: "text", text }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: bulk_delete_tasks
    // ─────────────────────────────────────────────
    server.tool("bulk_delete_tasks", "Ek sath kai tasks delete karo — IDs ki list do", {
        task_ids: z.array(z.string()).min(1).max(50).describe("Delete karni wali tasks ke IDs"),
    }, async ({ task_ids }) => {
        const tasks = await prisma.tasks.findMany({
            where: { id: { in: task_ids } },
            select: { id: true, title: true },
        });
        if (tasks.length === 0)
            return { content: [{ type: "text", text: "Koi task nahi mili in IDs se." }] };
        await prisma.tasks.deleteMany({ where: { id: { in: task_ids } } });
        const lines = tasks.map((t) => `   🗑️ "${t.title}"`).join("\n");
        return { content: [{ type: "text", text: `✅ ${tasks.length} tasks delete ho gayi:\n${lines}` }] };
    });
    // ─────────────────────────────────────────────
    // TOOL: bulk_create_tasks
    // ─────────────────────────────────────────────
    server.tool("bulk_create_tasks", "Ek sath kai tasks banao — list of tasks do", {
        tasks: z.array(z.object({
            title: z.string().min(1).describe("Task title — zarori"),
            created_by_name: z.string().describe("Creator ka naam — zarori"),
            description: z.string().optional(),
            priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
            category: z.enum(CATEGORIES).optional().describe("Task category (Area)"),
            tier: z.enum(TIERS).optional(),
            due_date: z.string().optional().describe("YYYY-MM-DD format"),
            company_name: z.string().optional().describe("Company ka naam — list_companies se check karo"),
            assignee_name: z.string().optional().describe("Assignee ka naam — list_employees se check karo"),
            start_date: z.string().optional().describe("YYYY-MM-DD format"),
        })).min(1).max(50),
    }, async ({ tasks: taskList }) => {
        const results = [];
        for (const t of taskList) {
            try {
                // Creator dhundho
                const creator = await prisma.employee.findFirst({
                    where: { name: { contains: t.created_by_name, mode: "insensitive" }, is_active: true },
                });
                if (!creator) {
                    results.push(`❌ "${t.title}" — creator "${t.created_by_name}" nahi mila`);
                    continue;
                }
                // Company dhundho (optional)
                let company_id = null;
                if (t.company_name) {
                    const company = await prisma.companies.findFirst({
                        where: { name: { contains: t.company_name, mode: "insensitive" } },
                    });
                    if (!company) {
                        results.push(`❌ "${t.title}" — company "${t.company_name}" nahi mili`);
                        continue;
                    }
                    company_id = company.id;
                }
                // Assignee dhundho (optional)
                let assignee_id = null;
                if (t.assignee_name) {
                    const assignee = await prisma.employee.findFirst({
                        where: { name: { contains: t.assignee_name, mode: "insensitive" }, is_active: true },
                    });
                    if (!assignee) {
                        results.push(`❌ "${t.title}" — assignee "${t.assignee_name}" nahi mila`);
                        continue;
                    }
                    assignee_id = assignee.id;
                }
                // Area dhundho (optional)
                let area_id = null;
                if (t.category && t.category !== "all") {
                    const area = await prisma.area.findFirst({
                        where: { name: { equals: t.category, mode: "insensitive" } },
                    });
                    if (area)
                        area_id = area.id;
                }
                await prisma.tasks.create({
                    data: {
                        title: t.title,
                        description: t.description ?? null,
                        priority: t.priority,
                        tier: t.tier === "None" ? null : (t.tier ?? null),
                        area_id: area_id,
                        status: "not_started",
                        created_by: creator.id,
                        due_date: t.due_date ? new Date(t.due_date) : null,
                        start_date: t.start_date ? new Date(t.start_date) : null,
                        company_id,
                        assignee_id,
                    },
                });
                results.push(`✅ "${t.title}" bana di`);
            }
            catch (err) {
                results.push(`❌ "${t.title}" — ${err instanceof Error ? err.message : "error"}`);
            }
        }
        const success = results.filter(r => r.startsWith("✅")).length;
        const fail = results.filter(r => r.startsWith("❌")).length;
        const summary = `📦 Bulk Create: ${success} success, ${fail} failed\n\n${results.join("\n")}`;
        return { content: [{ type: "text", text: summary }] };
    });
    return server;
} // end createServer()
// ─────────────────────────────────────────────
// START SERVER — HTTP (Render) ya stdio (local)
// ─────────────────────────────────────────────
if (process.env.PORT) {
    // Online mode — Render pe HTTP
    const { default: express } = await import("express");
    const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
    const app = express();
    app.use(express.json());
    app.post("/mcp", async (req, res) => {
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        const s = createServer();
        await s.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    app.get("/health", (_, res) => res.json({ status: "ok" }));
    const port = Number(process.env.PORT) || 3001;
    app.listen(port, () => console.log(`MCP server running on port ${port}`));
}
else {
    // Local mode — Claude Desktop ke liye stdio
    const transport = new StdioServerTransport();
    await createServer().connect(transport);
}
