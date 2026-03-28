import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { User, CreateUserSchema, ApiResponse } from '@basic-serverless-app/shared';

const app = new Hono();

// A simple in-memory mock DB adapter (for local dev dev:mock)
const mockDb = new Map<string, User>();

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = mockDb.get(id);
  
  if (!user) {
    const errorRes: ApiResponse<null> = { success: false, error: 'User not found' };
    return c.json(errorRes, 404);
  }
  
  const res: ApiResponse<User> = { success: true, data: user };
  return c.json(res);
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  const parsed = CreateUserSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ success: false, error: 'Invalid input' }, 400);
  }
  
  const newUser: User = {
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockDb.set(newUser.id, newUser);
  
  const res: ApiResponse<User> = { success: true, data: newUser };
  return c.json(res, 201);
});

// The exported handler for AWS Lambda (via CDK)
export const handler = handle(app);

// Also export the app for local development testing
export default app;
