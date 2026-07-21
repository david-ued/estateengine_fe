# EstateEngine 前端 TODO / Roadmap

> **單一 Agent 品牌看房網站**（2026-07-16 轉向，決策與 sitemap 對照見 `PIVOT.md`）。
> 風格參考 thebrandrealestategroup.com（黑白金奢華風）。
> 語系：zh-TW（預設）+ en，華人買家優先。後端 roadmap 見 `estateengine_be/TODO.md`。

## ✅ 已完成

### 多 agent SaaS 時期（2026-07-10 前後，架構沿用）
- [x] Next.js 16（App Router + Tailwind v4 + TS）scaffold、i18n 路由、`src/proxy.ts` 語系偵測 + Supabase session 刷新
- [x] Supabase Auth（登入/註冊、角色導向）、`@supabase/ssr`
- [x] 房貸試算 `src/lib/mortgage.ts`、物件建檔/編輯表單（獨家數據 + 評分滑桿）、照片上傳流程
- [x] 推薦清單管理 + 公開分享頁（自訂 OG）、瀏覽/停留/影片點擊上報
- [x] 進階篩選（雙向滑桿、獨家條件、persona preset）、AI 快速建檔（Gemini + token 點數）
- [x] 全站 a11y / loading 骨架 / error 邊界 / SEO 基礎

### 2026-07-16 — 單一 Agent 轉向（PIVOT.md）
- [x] i18n 縮為 zh-TW（預設）+ en；字典全面重寫（home/search/property/about/contact/account/inbox/brand）
- [x] 黑白金奢華主題：globals.css tokens（ink/gold/cream）、Playfair Display + Jost 字體、styles.ts 方角細框重寫
- [x] 深色導覽列 + 品牌 footer（讀 GET /site 的 agent 名片）
- [x] 移除 /admin、/agents 全部路由與 components/admin；角色剩 buyer/agent
- [x] 新首頁：Hero / Meet Your Agent / Stats band / Core values / 精選物件 / 聯絡 CTA
- [x] /search 搜尋體驗：頂部橫向篩選列、List/Map 切換、排序、Save Search；/properties 轉址保留 query
- [x] 物件內頁重排：anchor tabs、大圖 gallery、統計列、About This Property、Property Features 兩欄格、獨家數據區、房貸試算、詢問此物件
- [x] /about（單一 agent 品牌頁）、/contact（聯絡表單 → contact_messages）
- [x] 買家收藏（全站愛心 + FavoritesProvider 樂觀更新）、/account（收藏 + 儲存搜尋管理）
- [x] agent 後台新增：/agent/inbox（聯絡訊息收件匣）、/agent/brand（名片 + 首頁內容 + 實績數字編輯）
- [x] sitemap / robots 對齊新 sitemap

## 🔜 立即待辦

- [ ] ⚠️ 後端 migration 套用 + `pivot-single-agent.mjs` 跑完後，端到端再走一輪（收藏/儲存搜尋/聯絡表單/品牌設定）
- [ ] 列表卡片資訊密度與字級對照參考站再細修（含 Open House 標籤概念）
- [ ] Persona 範本與篩選 preset 改讀 DB（目前為前端常數）
- [ ] 照片刪除 / 排序 / 換封面；短影音（reel_video）上傳
- [ ] 推薦清單：OG 預覽圖上傳、刪除連結、清單排序
- [ ] sitemap 補已上架物件動態 URL
- [ ] 內頁 / 列表頁 per-page hreflang alternates

## 🎯 MLS 認證房仲正式使用缺口（2026-07-21 分析，完整清單見 `estateengine_be/TODO.md` 同名段落）

> **已做（同日）**：建檔表單 + 內頁「MLS® 編號」、聯絡表單與預售屋提醒 CASL 必勾同意、
> footer 與內頁名片 brokerage / 牌照條件揭露（`agency_name` 填回 DB 即顯示，目前 null 畫面不變）。

- [ ] Cookie / 追蹤同意橫幅（PIPEDA / BC PIPA：全站有瀏覽/停留/影片點擊追蹤）
- [ ] 預約賞屋時段選擇（行事曆或 Calendly 嵌入，內頁 CTA 升級）
- [ ] Open House 場次欄位 + 列表標籤（原「標籤概念」待辦升級為正式功能）
- [ ] Sold Properties / Testimonials 從「之後再補」提前（成交力證明；Sold 價格須登入可見＝VOW 規則）
- [ ] 帳號資料匯出 / 刪除流程（PIPEDA 資料權利）

## 📦 之後再補（參考站 sitemap 的延伸頁）
- Sold Properties（已成交作品集）
- Testimonials（客戶見證）
- Blog / 市場分析
- 社區導覽頁（Downtown / Yaletown / West End…）
- Saved search 新物件通知（email）
- 虛擬家具：聯盟行銷連結 / 輕量 iframe Widget 欄位（media 已支援 `virtual_staging_image`）

## 📦 Phase 2（非本期範圍）
- 臨近成交行情、進階 Analytics（漏斗、停留時間）
- 金流串接（Stripe，token 儲值）
