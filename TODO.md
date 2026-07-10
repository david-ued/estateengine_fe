# EstateEngine 前端 TODO / Roadmap

> SaaS 房仲客製化看房平台。角色：買家（Buyer）/ 房仲（Agent 專用介面）/ 總管理員（Super Admin 專屬後台）。
> 目標市場：加拿大 Edmonton / Vancouver / Toronto（CAD、sqft、預設語系 en）。
> 後端 roadmap 見 `estateengine_be/TODO.md`。

## ✅ 已完成

### Phase 0 — Infra
- [x] Next.js 16（App Router + Tailwind + TS）scaffold
- [x] i18n 四語系路由（en / fr / zh-TW / zh-CN），`src/proxy.ts` 語系偵測轉址
- [x] 字典檔架構 `src/i18n/dictionaries/*`（zh-TW 為權威型別）
- [x] Supabase client（browser / server component，`@supabase/ssr`）
- [x] `.env.example`（Supabase + NestJS API base URL）

### Phase 1 — 核心功能（部分）
- [x] 房貸試算 `src/lib/mortgage.ts`（寫死：頭期 20% / 貸款 80% / 30 年）
- [x] 權重評分 `src/lib/scoring.ts`（5 維度加權平均，對應 DB score_* 欄位）
- [x] 列表 / 內頁路由骨架（`PAGE_SIZE = 6`）
- [x] 登入 / 註冊頁（Supabase Auth，登入後依角色導向）
- [x] proxy 整合 Supabase session 自動刷新
- [x] 房仲專用介面 `/[locale]/agent`（角色守衛 + 我的物件列表 + 瀏覽量欄位）
- [x] Admin 專屬後台 `/[locale]/admin`（角色守衛 + 全物件巡邏 + 強制下架）
- [x] 行動端優先建檔表單 `/agent/properties/new`（獨家數據手動標籤：學區/交通/淹水區/地勢/風水/建商評價/建材/地下室 + 5 維度評分滑桿 + 外部影片連結）
- [x] 公開推薦清單頁 `/[locale]/share/[slug]`（房仲自訂 OG 標籤 via generateMetadata + 房仲名片）
- [x] 買家列表頁：串 BE API、filter（城市/價格/sqft/房衛）、每頁 6 筆分頁
- [x] 權重面板：5 維度滑桿 + Persona 一鍵套用 + 符合度徽章排序 + localStorage 記憶
- [x] 物件內頁：照片格、外部影片/3D 導覽嵌入（點擊計數）、獨家數據區塊、房仲名片、互動房貸試算
- [x] 瀏覽數 + 停留時間上報（進頁 pageview、離頁 keepalive fetch 回報秒數）
- [x] 推薦清單管理 `/agent/share-links`（勾選物件 → 一鍵生成 + 自訂 OG + 複製連結 + 點擊數）
- [x] 房仲數據面板欄位（每物件：瀏覽量 / 平均停留 / 影片點擊）
- [x] 物件編輯頁 `/agent/properties/[id]/edit`（複用建檔表單）+ 上架/隱藏/下架/成交狀態操作
- [x] 照片上傳流程（sign-upload → 直傳 Storage → 登記 media row，首張自動設封面）
- [x] Admin 使用者管理 `/admin/users`（升級房仲 / 降級買家）
- [x] 語系切換器（導覽列，四語系）
- [x] SEO：robots.txt + sitemap.xml（核心頁）+ 首頁 hreflang alternates
- [x] 上市 30 天內「新上市」標示（列表卡）
- [x] 買家權重雲端同步（登入者 debounce 寫入 buyer_weight_profiles，未登入 localStorage）
- [x] 進階篩選器：價格/坪數雙向滑桿、房衛/類型按鈕選、獨家篩選（學區排名/建商/建材/風水/大賣場）、手機全螢幕彈窗、Tabler Icons
- [x] 排序系統：系統推薦（權重符合度，預設）/ 最新上架 / 價格高低；>90 天物件前端強制隱藏
- [x] 物件卡升級：上市天數醒目標示、特色標籤（頂級建材/優質學區）、房仲迷你卡
- [x] 找房仲 `/agents` + 房仲專屬頁 `/agents/[id]`（介紹 + 代理物件）+ 導覽入口
- [x] ⚡ AI 快速建檔（Gemini 解析文字/截圖 → 半自動填表 + Token 扣點 + 餘額顯示/不足禁用/失敗退點）

## 🔜 Phase 1 剩餘（Must Have）

### 買家介面
- [ ] 符合度排序改為全域（目前僅當頁 6 筆內排序；需 BE 支援 score 排序或一次撈全量）
- [ ] Persona 範本改讀 DB `persona_templates`（目前為前端常數，與種子資料同步）
- [ ] 列表 UI 對照 REW 風格細修（卡片資訊密度、字級、留白）

### 房仲介面（/agent）
- [ ] 照片刪除 / 排序 / 換封面；短影音（reel_video）上傳
- [ ] 推薦清單：OG 預覽圖上傳（og_image_path）、刪除連結、清單排序
- [ ] 房仲個人名片編輯（bio、社群連結、頭像）

### Admin 後台（/admin）
- [ ] 巡邏列表：狀態 / 房仲 filter、異常物件標記
- [ ] 使用者停權（需 profiles 加 is_suspended + 登入攔截）
- [ ] 基礎數據總覽（總瀏覽量）

### 行銷 / SEO
- [ ] sitemap 補已上架物件動態 URL（待 DB）
- [ ] 內頁 / 列表頁 per-page hreflang alternates

### Phase 2 前置（PRD 降級方案）
- [ ] 虛擬家具：聯盟行銷連結 / 輕量 iframe Widget 欄位（media 已支援 `virtual_staging_image`）

## 🧭 SaaS 化（架構預留，勿在 Phase 1 實作）
- [ ] 多租戶：房仲隸屬仲介公司（agencies），介面依 agency 品牌化（logo / 主色 / 自訂網域）
- [ ] 訂閱方案 UI（方案比較、用量顯示；金流 Phase 2 才接 Stripe）
- [ ] Onboarding flow：房仲註冊 → 審核 → 開通
- [ ] 通知系統（物件即將到期 90 天提醒）

## 📦 Phase 2（Nice to Have，非本期範圍）
- 虛擬家具 AR 擺放與電商串接（本期僅 `virtual_staging_image` 照片降級方案）
- 臨近成交行情
- 進階 Analytics（漏斗、停留時間）
- 金流串接（Stripe）
