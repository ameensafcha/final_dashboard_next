-- Create notifications table for storing task notifications
-- Includes proper indexing for performance and RLS for access control

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_task ON notifications(task_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT only their own notifications
CREATE POLICY "users_can_select_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- Policy 2: Admins can SELECT all notifications
CREATE POLICY "admins_can_select_all_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM employees WHERE id = auth.uid()) = 'admin'
    OR recipient_id = auth.uid()
  );

-- Policy 3: Authenticated users can INSERT notifications
CREATE POLICY "authenticated_users_can_insert_notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy 4: Users can UPDATE read_at on their own notifications
CREATE POLICY "users_can_update_own_notification_read_at" ON notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
