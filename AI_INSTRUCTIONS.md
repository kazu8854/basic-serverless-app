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

## 4. Workspaces and Dependencies (MUST)
* Built on `npm workspaces`.
* Do NOT install dependencies globally; install them in the respective workspaces or monorepo root (for dev tools).

## 5. Technology Stack & Frameworks (Strongly Recommended)
* **Frontend**: Strongly recommended to use **React + Vite** for fast builds and HMR.
* **Authentication Flow**: 
  * Strongly recommended to implement a **MockAuth function** during local development to bypass AWS connections.
  * **CRITICAL**: The MockAuth flow MUST NOT be enabled or deployed in the Production environment.
* **Identity Provider (IdP)**: Strongly recommended to use **Amazon Cognito**. By standardizing and commonizing the IdP configuration across multiple services, we enable Single Sign-On (SSO) capabilities across the organization.
* **Backend Mock Mode**: Strongly recommended to implement a full in-memory mock backend mode to unblock frontend developers and speed up tests.

## 6. Architecture & Styling (Recommended)
* **CSS / Design System**: Recommended to use a comprehensive component library (e.g., Cloudscape Design System) to ensure UI consistency.
* **Local Testing**: Recommended to use **AWS SAM** CLI for robust local testing of AWS Lambda functions.
* **Databases**: 
  * Recommended to use **Amazon DynamoDB** as the default serverless DB.
  * *Exception*: Database selection should follow the "Right Tool for the Right Job" (適材適所) principle. Always prioritize architectural fit and **Cost Optimization** when proposing database changes.

## 7. AI Agent & MCP Integration (Recommended)
* **AgentCore Integration**: Recommended to design Backend Usecases (business logic) so they can easily be repurposed as tools for AI Agents (e.g., AgentCore) via the **Model Context Protocol (MCP)**.
* Extract pure logic / tool-friendly APIs from HTTP handlers to keep them "AI-Ready" (though this is not mandatory for every single endpoint).

**If you, the AI, are updating this project, do not propose generic architectural changes that violate these rules without explicit user approval.**
