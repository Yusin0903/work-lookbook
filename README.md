# Lookbook

3D 列印作品集網站。公開展示頁給客戶/朋友瀏覽,簡易管理後台上傳照片與影片。

## 技術棧

- Next.js 16(App Router, Server Actions)+ TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- Cloudflare R2(S3 相容物件儲存)存放照片/影片
- iron-session 做管理後台的登入驗證

## 本機開發

1. 啟動本機 PostgreSQL(或填入任何 PostgreSQL 連線字串到 `.env`):
   ```bash
   docker run -d --name lookbook-postgres -e POSTGRES_USER=lookbook -e POSTGRES_PASSWORD=lookbook -e POSTGRES_DB=lookbook -p 55432:5432 postgres:16-alpine
   ```
2. 複製 `.env.example` 為 `.env`,填入 R2 設定與後台帳密(見下方「設定 Cloudflare R2」)。
3. 安裝套件並跑資料庫遷移:
   ```bash
   npm install
   npx prisma migrate deploy
   ```
4. 啟動開發伺服器:
   ```bash
   npm run dev
   ```
5. 前台:http://localhost:3000 ,後台:http://localhost:3000/admin

## 設定 Cloudflare R2

1. 登入 [Cloudflare dashboard](https://dash.cloudflare.com/) → R2 → 建立一個 bucket(例如 `lookbook`)。
2. Bucket 設定裡啟用 Public Access,取得公開存取網址(`R2_PUBLIC_URL`),或掛上自訂網域。
3. R2 → 管理 API 權杖 → 建立一組有讀寫權限的 Access Key,取得 `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`。
4. Account ID 在 Cloudflare dashboard 右側欄可以找到,填入 `R2_ACCOUNT_ID`。
5. 把這四個值連同 `R2_BUCKET` 填進 `.env`(本機)或 Railway 的環境變數(正式環境)。

R2 前 10GB 儲存空間 + 每月 100 萬次 Class A 操作是免費額度,且沒有流出流量費,適合存放照片與影片。

## 部署到 Railway

1. 在 Railway 專案裡新增一個 PostgreSQL 服務,Railway 會自動產生 `DATABASE_URL`。
2. 新增這個 repo 作為另一個服務,在服務的環境變數裡:
   - 把 PostgreSQL 服務的 `DATABASE_URL` 參照進來(Railway 可以用 `${{Postgres.DATABASE_URL}}` 這種參照語法)
   - 填入 `R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET`、`R2_PUBLIC_URL`
   - 填入 `ADMIN_USERNAME`、`ADMIN_PASSWORD`(自己的後台帳密)
   - 填入 `SESSION_SECRET`(至少 32 字元的隨機字串,例如 `openssl rand -base64 32`)
3. Build 指令用預設的 `npm run build`(Railway 會自動偵測 Next.js),啟動指令用 `npm run start`。
4. 第一次部署後,到 Railway 的 shell 或用 `railway run` 執行一次 `npx prisma migrate deploy`,把資料表建到正式資料庫。
5. 媒體檔案都存在 R2,不佔用 Railway 的檔案空間,所以 Railway 這端只需要跑網站程式和存取資料庫的基本運算資源,Hobby 方案的額度通常就夠用。

## 後台使用

前往 `/admin` 登入,登入後可以：

- 新增作品(標題、描述、上傳多張照片/影片)
- 編輯作品(改標題描述、新增媒體、切換「公開顯示」)
- 刪除作品(連同 R2 上的媒體檔案一併刪除)
- 刪除單一媒體檔案

未登入時造訪 `/admin` 任何頁面都會導回登入頁。前台首頁只顯示「公開顯示」的作品。
