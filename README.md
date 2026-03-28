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

---

## 🏗 ディレクトリ構造 (Architecture)

* `packages/shared/` - フロントエンドとバックエンドで共有するZodスキーマや型定義。
* `packages/frontend/` - ユーザーインターフェース (React + Vite推奨)。
* `packages/backend/` - 軽量ルーター（Hono）を用いたメインAPIロジック。
* `packages/infrastructure/` - AWS CDK（TypeScript）によるインフラのコード化。

※ 開発に携わるAI向けの必須要件や推奨要件は `AI_INSTRUCTIONS.md` を厳格に参照してください。
