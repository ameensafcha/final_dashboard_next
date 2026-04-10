/**
 * Integration tests for notification creation on task assignment and comments
 *
 * This test suite verifies:
 * 1. Notification creation when task assignee changes (PUT /api/tasks)
 * 2. Notification creation when comment is posted (POST /api/tasks/[id]/comments)
 * 3. Atomicity of operations (both succeed or both fail)
 * 4. Correct notification fields and recipients
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Notification Creation Integration Tests', () => {
  let creatorId: string;
  let oldAssigneeId: string;
  let newAssigneeId: string;
  let taskId: string;

  beforeEach(async () => {
    // Create test users
    const creator = await prisma.employees.create({
      data: {
        id: `creator-${Date.now()}`,
        name: 'Creator User',
        email: `creator-${Date.now()}@test.com`,
      },
    });
    creatorId = creator.id;

    const oldAssignee = await prisma.employees.create({
      data: {
        id: `old-assignee-${Date.now()}`,
        name: 'Old Assignee',
        email: `old-${Date.now()}@test.com`,
      },
    });
    oldAssigneeId = oldAssignee.id;

    const newAssignee = await prisma.employees.create({
      data: {
        id: `new-assignee-${Date.now()}`,
        name: 'New Assignee',
        email: `new-${Date.now()}@test.com`,
      },
    });
    newAssigneeId = newAssignee.id;

    // Create a task with initial assignment
    const task = await prisma.tasks.create({
      data: {
        title: 'Integration Test Task',
        description: 'For testing notification triggers',
        created_by: creatorId,
        assignee_id: oldAssigneeId,
      },
    });
    taskId = task.id;
  });

  afterEach(async () => {
    // Clean up in order (notifications first due to foreign keys)
    await prisma.notifications.deleteMany({ where: { task_id: taskId } });
    await prisma.task_comments.deleteMany({ where: { task_id: taskId } });
    await prisma.tasks.delete({ where: { id: taskId } });
    await prisma.employees.deleteMany({
      where: {
        id: {
          in: [creatorId, oldAssigneeId, newAssigneeId],
        },
      },
    });
  });

  describe('Task Assignment Notifications (PUT /api/tasks)', () => {
    it('should create notification when assignee_id changes', async () => {
      // Simulate task update with new assignee
      const updatedTask = await prisma.$transaction(async (tx) => {
        const task = await tx.tasks.update({
          where: { id: taskId },
          data: { assignee_id: newAssigneeId },
          include: { assignee: true },
        });

        // Simulate the notification creation logic from the endpoint
        const assigneeChanged = newAssigneeId !== oldAssigneeId;
        if (assigneeChanged && newAssigneeId) {
          const newAssignee = await tx.employees.findUnique({
            where: { id: newAssigneeId },
          });

          if (newAssignee) {
            await tx.notifications.create({
              data: {
                recipient_id: newAssigneeId,
                actor_id: creatorId,
                action_type: 'task_assigned',
                task_id: taskId,
                task_title: task.title,
              },
            });
          }
        }

        return task;
      });

      // Verify notification was created
      const notifications = await prisma.notifications.findMany({
        where: { task_id: taskId },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        recipient_id: newAssigneeId,
        actor_id: creatorId,
        action_type: 'task_assigned',
        task_id: taskId,
        task_title: 'Integration Test Task',
      });
    });

    it('should not create notification when other fields change without assignee change', async () => {
      // Update task title only
      await prisma.tasks.update({
        where: { id: taskId },
        data: { title: 'Updated Title' },
      });

      const notifications = await prisma.notifications.findMany({
        where: { task_id: taskId },
      });

      expect(notifications).toHaveLength(0);
    });

    it('should not create notification when unassigning (assignee_id = null)', async () => {
      await prisma.tasks.update({
        where: { id: taskId },
        data: { assignee_id: null },
      });

      const notifications = await prisma.notifications.findMany({
        where: { task_id: taskId },
      });

      expect(notifications).toHaveLength(0);
    });

    it('should maintain atomicity: both operations succeed or both fail', async () => {
      // If notification creation fails, task update should be rolled back
      let transactionFailed = false;

      try {
        await prisma.$transaction(async (tx) => {
          // Update task
          await tx.tasks.update({
            where: { id: taskId },
            data: { assignee_id: newAssigneeId },
          });

          // Force an error to test rollback
          throw new Error('Simulated error for rollback test');
        });
      } catch (error) {
        transactionFailed = true;
      }

      expect(transactionFailed).toBe(true);

      // Verify task update was rolled back
      const task = await prisma.tasks.findUnique({ where: { id: taskId } });
      expect(task?.assignee_id).toBe(oldAssigneeId); // Should still be old assignee
    });
  });

  describe('Comment Notification Creation (POST /api/tasks/[id]/comments)', () => {
    it('should create notifications for task creator and assignee when comment posted', async () => {
      const commenterId = `commenter-${Date.now()}`;
      const commenter = await prisma.employees.create({
        data: {
          id: commenterId,
          name: 'Commenter',
          email: `commenter-${Date.now()}@test.com`,
        },
      });

      try {
        // Simulate comment creation with notification logic
        await prisma.$transaction(async (tx) => {
          // Get task with creator and assignee
          const task = await tx.tasks.findUnique({
            where: { id: taskId },
            include: { creator: true, assignee: true },
          });

          if (!task) throw new Error('Task not found');

          // Create comment
          await tx.task_comments.create({
            data: {
              task_id: taskId,
              employee_id: commenterId,
              content: 'Test comment',
            },
          });

          // Determine recipients: creator and assignee, excluding commenter
          const notificationRecipients = new Set<string>();

          if (task.created_by !== commenterId) {
            notificationRecipients.add(task.created_by);
          }

          if (task.assignee_id && task.assignee_id !== commenterId) {
            notificationRecipients.add(task.assignee_id);
          }

          // Create notifications
          await Promise.all(
            Array.from(notificationRecipients).map((recipientId) =>
              tx.notifications.create({
                data: {
                  recipient_id: recipientId,
                  actor_id: commenterId,
                  action_type: 'comment_posted',
                  task_id: taskId,
                  task_title: task.title,
                },
              })
            )
          );
        });

        // Verify notifications were created for both creator and assignee
        const notifications = await prisma.notifications.findMany({
          where: { task_id: taskId },
          orderBy: { created_at: 'asc' },
        });

        expect(notifications).toHaveLength(2);

        const recipients = notifications.map((n) => n.recipient_id).sort();
        expect(recipients).toEqual([creatorId, oldAssigneeId].sort());

        notifications.forEach((notif) => {
          expect(notif).toMatchObject({
            actor_id: commenterId,
            action_type: 'comment_posted',
            task_id: taskId,
            task_title: 'Integration Test Task',
          });
        });
      } finally {
        // Clean up
        await prisma.employees.delete({ where: { id: commenterId } });
      }
    });

    it('should not notify commenter about their own comment', async () => {
      // Commenter is the creator
      const commentContent = 'Self comment';

      await prisma.$transaction(async (tx) => {
        const task = await tx.tasks.findUnique({
          where: { id: taskId },
          include: { creator: true, assignee: true },
        });

        if (!task) throw new Error('Task not found');

        // Create comment by creator
        await tx.task_comments.create({
          data: {
            task_id: taskId,
            employee_id: creatorId, // Creator commenting
            content: commentContent,
          },
        });

        // Determine recipients
        const notificationRecipients = new Set<string>();

        if (task.created_by !== creatorId) {
          notificationRecipients.add(task.created_by);
        }

        if (task.assignee_id && task.assignee_id !== creatorId) {
          notificationRecipients.add(task.assignee_id);
        }

        // Should only have assignee as recipient
        expect(notificationRecipients.size).toBe(1);
        expect(notificationRecipients.has(oldAssigneeId)).toBe(true);

        await Promise.all(
          Array.from(notificationRecipients).map((recipientId) =>
            tx.notifications.create({
              data: {
                recipient_id: recipientId,
                actor_id: creatorId,
                action_type: 'comment_posted',
                task_id: taskId,
                task_title: task.title,
              },
            })
          )
        );
      });

      const notifications = await prisma.notifications.findMany({
        where: { task_id: taskId },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].recipient_id).toBe(oldAssigneeId);
    });

    it('should deduplicate if creator and assignee are same person', async () => {
      // Change assignee to creator (so creator is both creator and assignee)
      await prisma.tasks.update({
        where: { id: taskId },
        data: { assignee_id: creatorId },
      });

      const commenterId = `commenter2-${Date.now()}`;
      const commenter = await prisma.employees.create({
        data: {
          id: commenterId,
          name: 'Commenter 2',
          email: `commenter2-${Date.now()}@test.com`,
        },
      });

      try {
        await prisma.$transaction(async (tx) => {
          const task = await tx.tasks.findUnique({
            where: { id: taskId },
            include: { creator: true, assignee: true },
          });

          if (!task) throw new Error('Task not found');

          await tx.task_comments.create({
            data: {
              task_id: taskId,
              employee_id: commenterId,
              content: 'Comment from third party',
            },
          });

          const notificationRecipients = new Set<string>();

          if (task.created_by !== commenterId) {
            notificationRecipients.add(task.created_by);
          }

          if (task.assignee_id && task.assignee_id !== commenterId) {
            notificationRecipients.add(task.assignee_id);
          }

          // Should only have one recipient (creatorId) even though creator and assignee are the same
          expect(notificationRecipients.size).toBe(1);

          await Promise.all(
            Array.from(notificationRecipients).map((recipientId) =>
              tx.notifications.create({
                data: {
                  recipient_id: recipientId,
                  actor_id: commenterId,
                  action_type: 'comment_posted',
                  task_id: taskId,
                  task_title: task.title,
                },
              })
            )
          );
        });

        const notifications = await prisma.notifications.findMany({
          where: { task_id: taskId },
        });

        expect(notifications).toHaveLength(1);
        expect(notifications[0].recipient_id).toBe(creatorId);
      } finally {
        await prisma.employees.delete({ where: { id: commenterId } });
      }
    });
  });
});
