export interface Task {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  company_id: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  created_at: string;
  estimated_hours: number | null;
  recurrence: string | null;
  company?: { id: string; name: string } | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  subtasks?: { id: string; title: string; is_completed: boolean }[];
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    file_type: string | null;
    created_at: string;
  }[];
}

export interface Company {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
}

export const AREA_OPTIONS = [
  "Production", "Quality", "Warehouse", "Procurement",
  "HR", "Admin", "Development", "Maintenance", "Finance",
];

export interface CreateTaskInput {
  title: string;
  status: string;
  priority: string;
  company_id: string;
  area: string;
  assignee_id: string;
  due_date: string;
}

