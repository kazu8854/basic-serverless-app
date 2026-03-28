import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { CreateUserSchema } from '@basic-serverless-app/shared';
import { MockDbAdapter } from './adapters/mock-db-adapter';
import { UserUsecase } from './usecases/user-usecase';

// --- Dependency Injection (Ports and Adapters) ---
// Switch adapter based on environment variable.
// In production Lambda, replace MockDbAdapter with AwsDynamoDbAdapter.
const isMock = process.env.MOCK_AWS === 'true';
const dbAdapter = isMock ? new MockDbAdapter() : new MockDbAdapter(); // TODO: replace second with AwsDynamoDbAdapter

const userUsecase = new UserUsecase(dbAdapter);

// --- Hono Application ---
const app = new Hono();

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const result = await userUsecase.getUser(id);

  if (!result.success) {
    return c.json(result, 404);
  }
  return c.json(result);
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  const parsed = CreateUserSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const result = await userUsecase.createUser(parsed.data);
  return c.json(result, 201);
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', mock: isMock });
});

// The exported handler for AWS Lambda (via CDK)
export const handler = handle(app);

// Also export the app for local development testing
export default app;
