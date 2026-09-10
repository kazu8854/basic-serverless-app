import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { User, CreateUserRequest } from '@basic-serverless-app/shared';
import { DbPort } from './db-port';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * DynamoDB implementation of DbPort, backed by the single-table (PK/SK)
 * design provisioned in packages/infrastructure. Users are stored as:
 *   PK = `USER#<id>`, SK = `PROFILE`
 * so `getUser` is a single GetItem and `createUser` a single PutItem.
 */
export class DynamoDbAdapter implements DbPort {
  constructor(private readonly tableName: string) {}

  async getUser(id: string): Promise<User | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `USER#${id}`, SK: 'PROFILE' },
      })
    );

    return result.Item ? this.toUser(result.Item) : null;
  }

  async createUser(input: CreateUserRequest): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: { PK: `USER#${user.id}`, SK: 'PROFILE', ...user },
      })
    );

    return user;
  }

  private toUser(item: Record<string, unknown>): User {
    const { PK, SK, ...user } = item;
    return user as User;
  }
}
