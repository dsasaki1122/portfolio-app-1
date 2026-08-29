# DB セットアップ手順

このプロジェクトのローカル DB（Prisma + MySQL）を、クローンした状態から再現するための手順です。

- ローカル: Docker の `mysql:8.0` コンテナ
- 本番想定: Aurora MySQL 8.0（`src/infra/` の CloudFormation 参照）
- ORM: Prisma 7 系（ドライバアダプタ `@prisma/adapter-mariadb` 経由で接続）
- テーブル定義の正: [`prisma/schema.prisma`](../prisma/schema.prisma)（5テーブル: `users` / `restaurants` / `restaurant_images` / `tags` / `restaurant_tags`）

---

## 1. 前提ツール

| ツール | 用途 | 備考 |
|---|---|---|
| Docker Desktop | ローカル MySQL コンテナの起動 | 起動して「Docker Desktop is running」状態にしておく |
| Node.js 22.x / npm | アプリと Prisma CLI の実行 | 動作確認は v22.15.1 |

---

## 2. 初回セットアップ手順

上から順に実行します。

### 2-1. 依存パッケージのインストール

```bash
npm install
```

`prisma` / `@prisma/client` / `@prisma/adapter-mariadb` / `tsx` / `dotenv` などが入ります。

### 2-2. 環境変数ファイルの作成

```bash
cp .env.example .env
```

`.env` の内容（ローカルは編集不要）:

```
DATABASE_URL="mysql://root:password@localhost:3306/gohan_note"
```

`.env` は Git 管理対象外です（`.env.example` のみコミットされます）。

### 2-3. MySQL コンテナの起動

```bash
docker compose up -d
docker compose ps        # STATUS が (healthy) になるまで数十秒待つ
```

`docker-compose.yml` で `mysql:8.0` / DB 名 `gohan_note` / ポート `3306` を定義しています。データは名前付き volume に保存されます。

### 2-4. マイグレーションの適用（テーブル作成）

```bash
npm run db:migrate       # = prisma migrate dev
```

- [`prisma/migrations/`](../prisma/migrations/) にある全マイグレーションをローカル DB に適用します。
- Prisma Client（`src/generated/prisma/`）も生成されます。**このディレクトリは Git 管理対象外なので、各自の環境で必ず生成が必要です**（このコマンドが自動で生成します。単独で生成したい場合は `npm run db:generate`）。

### 2-5. サンプルデータの投入

```bash
npm run db:seed          # = prisma db seed → tsx prisma/seed.ts
```

デモユーザー `demo@example.com` ＋ 4店舗 ＋ タグ9種が入ります。冪等（何度実行しても同じ状態）です。

### 2-6. 確認

```bash
npm run db:studio
```

ブラウザで http://localhost:5555 が開き、5テーブルが表示されます。`restaurants` 4件・`tags` 9件・`restaurant_tags` 9件が入っていれば成功です。

---

## 3. 日常コマンド一覧

| コマンド | 用途 |
|---|---|
| `docker compose up -d` | DB 起動 |
| `docker compose down` | DB 停止（データは volume に残る） |
| `docker compose down -v` | DB 停止 ＋ データ全削除 |
| `npm run db:migrate -- --name <変更名>` | スキーマ変更時の差分マイグレーション作成＋適用 |
| `npm run db:migrate` | 未適用のマイグレーションを適用（他メンバーの変更を取り込むとき） |
| `npm run db:seed` | サンプルデータ再投入 |
| `npm run db:studio` | GUI でデータ確認（http://localhost:5555） |
| `npx prisma migrate reset` | DB を全削除 → 再マイグレーション → seed 自動実行（作り直し。**ローカル専用**） |

---

## 4. スキーマを変更するときのワークフロー

1. [`prisma/schema.prisma`](../prisma/schema.prisma) を編集する
2. `npm run db:migrate -- --name <変更内容>` を実行（例: `-- --name add_restaurant_phone`）
3. 生成された `prisma/migrations/<タイムスタンプ>_<変更名>/` を **コミットする**
4. 他のメンバーは `git pull` 後に `npm run db:migrate` を実行すれば同じ状態になる

`prisma/migrations/` と `prisma/migrations/migration_lock.toml` は必ず Git 管理下に置きます。

---

## 5. トラブルシューティング

| 症状 | 対処 |
|---|---|
| `docker compose up` でポート 3306 が使用中 | ローカルの既存 MySQL を停止する。または `docker-compose.yml` の `ports` と `.env` の `DATABASE_URL` を `3307` に揃えて変更する |
| `PrismaClientInitializationError: A driver adapter is required` | 依存不足。`npm install` を実行する（Prisma 7 は接続にドライバアダプタが必須） |
| `Environment variable not found: DATABASE_URL` | `.env` が未作成。`cp .env.example .env` を実行する。Prisma CLI は `prisma7.config.ts` の `import "dotenv/config"` 経由で `.env` を読む |
| マイグレーションが競合／エラーで進めない | `npx prisma migrate reset` でローカル DB を作り直す（本番では使わない） |
| `src/generated/prisma` が見つからないと型エラー | `npm run db:generate` で Prisma Client を生成する |

---

## 6. 構成の背景メモ

- **Prisma 7**: generator は新方式の `prisma-client`。出力先は `src/generated/prisma`（`.gitignore` 済み）。
- **ドライバアダプタ**: Prisma 7 は Rust エンジンを廃止したため、実行時の接続に `@prisma/adapter-mariadb`（MySQL / Aurora MySQL 8.0 対応）が必須。[`src/lib/prisma.ts`](../src/lib/prisma.ts) で Prisma Client を初期化しており、アプリからは `import { prisma } from "@/lib/prisma"` で使う。
- **設定ファイル**: `prisma7.config.ts`（スキーマパス・マイグレーションパス・seed コマンド・`DATABASE_URL` の受け渡し）。
- **DB エンジン**: ローカルは Docker の `mysql:8.0`、本番想定は Aurora MySQL 8.0。ローカルと本番でスキーマ挙動を揃えるためバージョンを合わせている。

---

## 7. 本番（Aurora）への適用（参考・別作業）

1. `DATABASE_URL` を Aurora writer エンドポイントに向ける
   - Aurora はプライベートサブネット配置のため、EC2 踏み台経由の SSM ポートフォワードが必要
   - TLS 必須: 接続文字列に `?ssl-mode=REQUIRED` を付与
2. DB `gohan_note` を事前に `CREATE DATABASE` で作成
3. `npm run db:deploy`（= `prisma migrate deploy`）で `prisma/migrations/` をそのまま適用

`migrate deploy` は既存マイグレーションの適用のみを行い、スキーマ差分の生成やデータ削除はしません。
