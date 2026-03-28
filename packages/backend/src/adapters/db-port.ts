import { User, CreateUserRequest } from '@basic-serverless-app/shared';

// Ports (Interfaces) definition for the Hexagonal Architecture
export interface DbAdapter {
  getUser(id: string): Promise<User | null>;
  createUser(user: CreateUserRequest): Promise<User>;
}
