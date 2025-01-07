import { db } from "@db";
import { tasks } from "@db/schema";
import { eq } from "drizzle-orm";

export class TaskQueue {
  static async createTask(taskId: string, userId: number, prompt: string) {
    const [task] = await db.insert(tasks)
      .values({
        taskId,
        userId,
        prompt,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return task;
  }

  static async updateTask(taskId: string, data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    output?: any;
    metadata?: any;
  }) {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tasks.taskId, taskId))
      .returning();

    return updatedTask;
  }

  static async getTask(taskId: string) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, taskId)
    });

    return task;
  }
}

export default TaskQueue;