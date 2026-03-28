# AI Architect Instructions: basic-serverless-app

This repository is a monorepo for a highly scalable, developer-friendly serverless application (`basic-serverless-app`).
Any AI coding assistant generating code or configurations for this repository MUST adhere strictly to the rules below.

## 1. Architecture: Ports and Adapters (Hexagonal Architecture)
* **Backend (`packages/backend`)**: MUST separate business logic from infrastructure using interfaces. All AWS-specific logic (DynamoDB, Cognito, etc.) MUST be abstracted behind an adapter interface.
* **Testing / Mocking**: The project MUST support running completely offline with mock implementations of AWS services via environment variables (`MOCK_AWS=true`).
* **Frameworks**: 
  * Backend routing MUST rely on `hono`. 
  * Direct invocation logic in `packages/infrastructure` MUST route to this Hono application.

## 2. Infrastructure as Code (IaC)
* MUST use strictly **AWS CDK** (`packages/infrastructure`).
* Always expose scripts to test easily and hotswap code using `cdk watch`. Do not mandate slow full CloudFormation deployments for code changes.

## 3. Shared Resources
* **`packages/shared`**: ALL Domain models, API request/response types, and Zod schemas MUST be defined in `packages/shared`.
* Both Frontend (`packages/frontend`) and Backend MUST import types and schemas directly from `packages/shared`. Do NOT duplicate types.

## 4. Workspaces and Dependencies
* Built on `npm workspaces`.
* Do NOT install dependencies globally; install them in the respective workspaces or monorepo root (for dev tools).

**If you, the AI, are updating this project, do not propose generic architectural changes that violate these rules without explicit user approval.**
