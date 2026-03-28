# Basic Serverless App Boilerplate

Welcome to the `basic-serverless-app` boilerplate! This repository provides a highly scalable and developer-friendly template for serverless applications.

## 💡 設計思想と目的 (Design Philosophy & Purpose)

クラウドネイティブなサーバーレスアプリケーション開発において、開発者が直面しがちな「開発スピードの低下（DXの悪化）」を根本から解決するために作成されました。

### 1. 「AWSに繋がないとテストできない」の解消
サーバーレス開発で最も苦痛なのは「CloudFormationやCDKのデプロイを待たないと動作確認ができない」ことです。
当テンプレートでは、**Hexagonal Architecture (Ports and Adapters)** と **Hono** を採用し、AWSリソース（DBや認証機構）へのアクセスを完全にインターフェースで分離しています。
これにより、環境変数一つで「完全オフラインのMockモード」と「AWS接続モード」を切り替えることができ、フロントエンドもバックエンドもローカル環境で爆速のイテレーションを回すことが可能になっています。

### 2. フロントエンドとバックエンドの「型の同期漏れ」の撲滅
モノレポ（npm workspaces）構成を活用し、`packages/shared` に型定義（Type）とバリデーション定義（Zodスキーマ）を集約しています。
APIの仕様変更が行われた瞬間に、フロントエンド側でも即座にTypeScriptが型エラーを検知するため、本番にバグが混入するリスクを劇的に低減します。

### 3. スケーラビリティと認証の共通化
複数の社内システムやアプリケーションを展開していく際、IDプロバイダー（IdP）の統合が鍵になります。このテンプレートの基本構成に沿ってIdPを共通化することで、システム間のSSO（シングルサインオン）を容易に実現する基盤として設計されています。

### 4. AgentCore/MCP との統合を見据えた「AI Ready」な設計
Honoの軽量ルーティングと、Ports and Adaptersによるビジネスロジック（Usecase）の分離は、バックエンドの機能を **AWS Bedrock Agents (AgentCore) など** のAIエージェントに直接「Tool（Action Group）」として提供することを容易にします。純粋な関数やクラスベースのUsecaseとして独立させておくことで、**Model Context Protocol (MCP)** を介したシームレスな機能連携を想定した設計となっています。

**▼ AI Agent統合のために想定されている対応例とアプローチ**
1. **OpenAPI スキーマの自動出力と連携 (Zod活用)**
   Bedrockエージェント等のツール統合時には「OpenAPIスキーマのJSON定義」が必須になります。本リポジトリでは `packages/shared` でZodを用いた型定義を一元化しているため、`@hono/zod-openapi` などを利用することで、型情報からAI向けのスキーマを容易に「自動生成・同期」できます。
2. **AI Action Group 用のエンドポイント分離**
   既存のフロントエンド（SPA）向けルーティングに無理やり混ぜるのではなく、AIが呼び出す専用のエンドポイントパス（例: `/api/agent/*`）をHonoに追加するだけで、裏側の巨大なビジネスロジック（Usecase層）はそのまま再利用できます。
3. **エージェントからの認証情報の受け渡し (Cognito連携)**
   AIエージェントがユーザーに代わって処理を行う場合、認証コンテキストは以下のフローで安全にバックエンドへ引き回す想定です。
   * **トークンの付与**: エージェント（AgentCore）は認証済みIdP（Cognito）のOAuth連携等により、有効なトークンを保有します。
   * **イベント統合**: エージェントがLambdaをキックする（またはAPI Gatewayを叩く）際、イベントペイロード層（ヘッダやセッションコンテキスト）にトークンが渡されます。
   * **Middleware検証**: Honoに備えた認証ミドルウェアでそのトークンを検証し、リクエストを投げた「実際のユーザーID」を特定。今まで通りUsecase層へユーザー情報を引き渡すことで、既存の認証認可ロジックをそのまま活かせます。

---

## 🏗 ディレクトリ構造 (Architecture)

* `packages/shared/` - フロントエンドとバックエンドで共有するZodスキーマや型定義。
* `packages/frontend/` - ユーザーインターフェース (React + Vite推奨)。
* `packages/backend/` - 軽量ルーター（Hono）を用いたメインAPIロジック。
* `packages/infrastructure/` - AWS CDK（TypeScript）によるインフラのコード化。

※ 開発に携わるAI向けの必須要件や推奨要件は `AI_INSTRUCTIONS.md` を厳格に参照してください。

---

## ⚠️ Disclaimer (免責事項)

* **Unofficial / Personal Work:** 
  This repository is a personal project and is NOT affiliated with, endorsed by, or connected to any organization or company the author is associated with.
  （本リポジトリは完全に個人のプロジェクトであり、私の所属企業や組織とは一切関係がありません。）
* **AWS Costs:** 
  Deploying this project via AWS CDK may incur costs on your AWS account. You are solely responsible for monitoring your AWS infrastructure and managing any associated billing.
  （本構成をAWSへデプロイすることによって発生した利用料金や損害について、作者は一切の責任を負いません。クラウドのコスト管理は自己責任で行ってください。）
* **No Warranty:** 
  This software is provided "as is", without warranty of any kind. 
  （本ソフトウェアは「現状有姿」で提供され、いかなる保証もありません。）
