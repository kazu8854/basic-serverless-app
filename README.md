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

## 🤖 AgentCore / MCP 統合ガイド (AI-Ready Backend)
当ボイラープレートのバックエンドは、**AWS Bedrock Agents (AgentCore)** や **Model Context Protocol (MCP)** とシームレスに統合し、AIエージェントに自律的な「Tool（Action Group）」として機能を提供することを前提に設計されています。以下はAgent統合へのフェーズ別アプローチと認証のベストプラクティスです。

### 統合への3ステップ（Agent化の手順）
1. **専用の受け口（エンドポイント）の作成**
   フロントエンド用の複雑なAPIとは別に、AIが呼び出しやすい専用のシンプルなフラットJSONエンドポイント（例: `/api/agent/*`）をHonoに生やします。裏側のビジネスロジック（Usecase）は全く同じものを再利用（DRY）します。
2. **OpenAPI スキーマの自動出力 (Zod活用)**
   BedrockエージェントやMCPはツールの仕様書としてOpenAPI(JSON)を要求します。`packages/shared` のZodスキーマに `.describe("AI向けの詳細な指示や判断基準")` を付与し、`@hono/zod-openapi` で自動書き出しを行うことで、AI向けのプロンプト指示と型定義を一元管理できます。
3. **認証フローの統合（目的に応じた2つのアプローチ）**
   AIエージェント経由でセキュアにユーザーデータを操作するための認証アプローチは以下の2通りです。

### 【推奨】アプローチA: 認証をAWSに任せ切る (AgentCore OAuth 2.0 連携)
**対象:** 完全な自律型AgentCore（AWS上でのシームレスな体験）を作りたい場合
*   **方法:** Bedrock AgentsのAction Group設定において、IdPとの「OAuth 2.0連携」を設定します。
*   **注意点とベストプラクティス (最重要):** ここで設定するIdP（例:社内SSO等）は、**既存のフロントエンド向けCognitoでフェデレーション設定しているIdPと「全く同じもの」を設定**してください。
*   **メリット:** エージェントとのチャット中に自動でIdPログインが走り、エージェントが取得した「本物のJWT」が裏側のLambda（Hono）に送信されます。開発者は面倒なToken回しをブラウザやコード上に一切書くことなく、**100%シームレスでセキュアなAIアーキテクチャ**が完成します。

### アプローチB: ローカル・クライアントで閉じた認証 (MCP / Return of Control)
**対象:** ローカルのClaude DesktopなどからMCP形式で繋ぎたい場合や、アプリ側で細かく通信制御したい場合
*   **方法 (MCP):** 開発者がブラウザ（フロントエンド画面等）で取得した本物のログインJWTを、ローカルで立ち上げたMCPサーバーの環境変数に渡し、実行のたびにMCPサーバーがAPIへ Authorization ヘッダを付与して叩きます。
*   **方法 (Bedrock Return of Control):** Bedrockから「ツールの実行指示（パラメータ）」だけを受け取り、トークンを持ったクライアントアプリ側が自力でHonoを叩きます。
*   **メリット:** エージェントには複雑な認証の仕組みを教えずとも、ローカルPCや自作アプリ起点で、本番同等のエンドツーエンドテスト（MOCK_AWS=falseのAWS接続モード）が爆速で行えます。

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
