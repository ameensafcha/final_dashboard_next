-- Enable REPLICA IDENTITY FULL for real-time notifications
-- Required for Supabase Realtime to stream changes from the notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;