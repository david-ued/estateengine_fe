# PIVOT — 轉向「單一 Agent」品牌網站（2026-07-16）

> 本文件是這次方向調整的**決策紀錄 + 執行日誌**。後端對應變更見 `estateengine_be/PIVOT.md`。
> 原多 agent SaaS 方向的歷史紀錄保留在各自 `TODO.md` 的「已完成」區。

## 1. 方向

EstateEngine 從「多房仲 SaaS 平台」收斂為 **單一 agent 的個人品牌網站**：
整個網站只有一位房仲上架物件，把買家看房體驗做到極致。

參考網站：<https://thebrandrealestategroup.com/search-mls/>
（The BRAND Real Estate Group — 黑白金奢華風、MLS 搜尋體驗）

## 2. 已拍板決策（2026-07-16 與 David 確認）

| 議題 | 決定 |
| --- | --- |
| 網站範圍 | **核心頁優先**：首頁 + Search 體驗 + 物件內頁 + About + Contact。Blog / Sold Properties / Testimonials 之後再補 |
| 帳號架構 | **Agent + 買家帳號**：agent 一組帳號管理物件（即最高權限）；買家可註冊，用於收藏物件與儲存搜尋條件。**Super Admin 後台移除** |
| 特色功能 | 全數保留：AI 快速建檔、獨家數據標籤（學區/風水/建商…）、推薦清單分享連結、房貸試算器 |
| 語系 | **zh-TW + en 兩語系，中文優先（zh-TW 為預設語系）**。移除 fr / zh-CN |

### 附帶技術決策（依上述方向推導，可再調整）

- **角色簡化**：`user_role` 只剩 `buyer` / `agent`；`super_admin` 從 enum、RLS、guards 全面移除。既有 admin 測試帳號降為 buyer。
- **單一 agent 不變量**：系統不再提供任何「升級為 agent」介面；agent 帳號由 DB 手動指定，應用層以「唯一 role='agent' 的 profile」為品牌主體。
- **新資料表**：`favorites`（買家收藏）、`saved_searches`（儲存搜尋條件）、`contact_messages`（聯絡表單收件）、`site_settings`（首頁品牌內容：統計數字、核心價值、hero 文案）。
- **地圖**：Search 頁 List/Map 切換沿用/強化既有 `listings-map`（免 API key 方案優先）。
- **權重/符合度排序不回歸**（2026-07-11 已退場），排序維持：最新上架 / 價格。
- **90 天自動下架 Cron 保留**（PRD 既有規則，與單一 agent 無衝突）。

## 3. Sitemap 對照

| The BRAND | EstateEngine 新版 | 說明 |
| --- | --- | --- |
| Home | `/[locale]` | hero、品牌故事、統計數字、核心價值、精選物件、搜尋入口、聯絡 CTA |
| Search MLS（List/Map） | `/[locale]/search` | 頂部橫向篩選列 + List/Map 切換 + Save Search + 收藏愛心（原 `/properties` 轉址過來） |
| Listing 內頁 | `/[locale]/properties/[id]` | tabs（Details/Map/獨家數據）、About This Property、Property Features 兩欄格、房貸試算、agent 名片 |
| Our Team | `/[locale]/about` | 單一 agent 品牌頁（取代原 `/agents`、`/agents/[id]`，兩路由移除） |
| Contact Us | `/[locale]/contact` | 聯絡表單（寫入 `contact_messages`）+ 聯絡資訊 |
| （Login / Save Search） | `/[locale]/account/favorites`、`/[locale]/account/saved-searches` | 買家帳號區 |
| — | `/[locale]/agent/**` | agent 後台照舊（物件/分享清單/AI 建檔），新增：聯絡訊息收件匣、品牌設定 |
| — | `/[locale]/share/[slug]` | 推薦清單分享頁保留 |
| ~~Blog / Sold / Testimonials~~ | （本期不做） | 之後再補 |
| ~~/admin~~ | **移除** | Super Admin 後台與相關元件全刪 |

## 4. 視覺方向（複製參考站 style）

- **色票**：黑（#0b0b0b 系）/ 白 / 金（champagne gold accents），取代現行品牌藍。
- **字體感**：優雅襯線標題 + 乾淨無襯線內文；細字重、大留白、全大寫小標（tracking 寬）。
- **元件**：細框線、方角或極小圓角、hover 金色底線；照片為主角（大圖、滿版 hero）。
- 唯一樣式來源維持 `src/components/ui/styles.ts` + `globals.css` design tokens。

## 5. 執行日誌

- [x] 2026-07-16 與 David 確認四項方向決策（範圍/帳號/功能/語系）
- [x] 2026-07-16 建立本文件
- [x] DB migration 撰寫：`estateengine_be/supabase/migrations/20260716000001_single_agent_pivot.sql`（⚠️ 尚未套用到遠端，見下方「需手動執行」）
- [x] BE：移除 admin 端點與 users module；新增 favorites / saved-searches / contact / site 模組（tsc 通過）
- [x] FE：i18n 縮為 zh-TW（預設）+ en，字典全面重寫
- [x] FE：黑白金主題重塑（globals tokens / styles.ts / 深色 nav / 品牌 footer / Playfair+Jost 字體）
- [x] FE：新首頁（Hero / Meet Your Agent / Stats / Values / 精選物件 / CTA）
- [x] FE：移除 /admin、/agents 路由與 components/admin
- [x] FE：About / Contact（含聯絡表單 → contact_messages）
- [x] FE：Search 體驗（頂部篩選列 / List-Map 切換 / 排序 / Save Search；/properties 307 轉址保留 query）
- [x] FE：物件內頁重排（sticky anchor tabs / gallery / 統計列 / About / Property Features 兩欄格 / 獨家數據深色區 / 房貸試算 / 詢問此物件）
- [x] FE：買家帳號區（/account 收藏 + 儲存搜尋管理）+ agent 收件匣（/agent/inbox）與品牌設定（/agent/brand）
- [x] 資料：歸戶腳本 `estateengine_be/scripts/pivot-single-agent.mjs`（⚠️ 尚未執行，見下方）
- [x] 2026-07-16 端到端驗證：FE tsc/eslint 0 錯誤、BE tsc 通過；dev server 走查 首頁/搜尋(List+Map)/內頁/About/Contact/登入 皆正常、無 console/server error；/account 未登入正確導向登入頁；/properties 舊網址 307 轉址至 /search 並保留 query
- [x] TODO.md（FE/BE）重整為新方向

> 註：收藏 / 儲存搜尋 / 聯絡表單送出 / 品牌設定「寫入」需等 migration 套用後才能全流程測試（相關資料表尚未存在；前端皆有優雅降級）。

### 第二輪調整（2026-07-16，David 指示）

- [x] 品牌改為 **Tim Lin**（David 為 Tim Lin 建置本站）：網站 title / metadata template、字典 appName、DB agent 顯示名稱已更新；**全站不再顯示仲介公司（Realty）**——nav、footer、About、物件卡刊登者、內頁名片、分享頁、品牌設定表單全部拿掉 agency 欄位顯示
- [x] 語言切換改自製等寬按鈕 segmented control（繁中 / EN），不再用原生 select
- [x] /search 寬版（≥1280px）改為**分割視圖**：列表（左，雙欄卡片）+ sticky 地圖（右）同時呈現；List/Map 切換僅窄版保留
- [x] 「更多條件」（獨家進階篩選）由彈窗改為**向下延展面板**（persona / 面積 / 學區 / 建商 / 建材 / 風水 / 生活機能雙欄排列）；彈窗只剩手機全螢幕篩選
- [x] 新增 `/terms`（服務條款）與 `/privacy`（隱私權政策）簡易法務頁（zh-TW / en 雙語內容、footer 連結、sitemap 收錄）
- [x] 驗證：FE tsc/eslint 0 錯誤；瀏覽器走查 title「… | Tim Lin」、分割視圖、展開面板、法務頁、footer 連結皆正常，無 console error

> ⚠️ 資料註記：DB 目前有兩個 agent 帳號（`agent@estateengine.test` 測試種子 + `davidlin1727@gmail.com` 真實帳號），兩者顯示名稱都已更新為 Tim Lin。跑歸戶腳本時請用參數指定要保留哪一個：`node scripts/pivot-single-agent.mjs davidlin1727@gmail.com`（或不帶參數保留最早的測試帳號）。

### 第三輪調整（2026-07-16，David 指示）— 後台重新整頓

- [x] **Route group 重構**：`[locale]/layout.tsx` 精簡為 html/body/字體/`FavoritesProvider` 純外殼；行銷版深色頁首+頁尾移入新 group `[locale]/(site)/layout.tsx`，所有公開頁（首頁 / search / properties / about / contact / login / signup / account / share / terms / privacy / `[...rest]`）移入 `(site)`（route group 不影響 URL）。頁面轉場 `template.tsx` 下放到 `(site)` 與 `agent`，頁首/頁尾不再隨導航重播。
- [x] **Agent 後台改左側 side nav**：新增 `components/agent/agent-shell.tsx`（shadcn 風格、`@tabler/icons-react` 圖示、`lib/utils.ts` 的 `cn()`）。深色 ink 側欄＋金色 active，桌機常駐、手機為漢堡抽屜；底部含使用者名稱 / 回到網站 / 登出。`agent/layout.tsx` 改用此外殼，後台不再套行銷頁首/頁尾。導覽項目：我的物件 / 新增物件 / 推薦清單 / 聯絡訊息 / 品牌設定 / 會員管理。
- [x] **Buyer 不做獨立後台**：帳號區續留行銷殼、由 `NavAuth` 反應登入狀態。`/account` 加水平子導覽（收藏與搜尋 ↔ 帳號設定）；新增 `/account/settings`（`ProfileSettingsForm`：更新 `profiles.display_name` + `supabase.auth.updateUser` 變更密碼，email 唯讀）。
- [x] 字典：`account.navSaved/navSettings/settings.*`、`agent.viewSite`（zh-TW / en 同步）。
- [x] 驗證：`next build` 39 路由正常（含 `/[locale]/account/settings`，`(site)` 不進 URL）、FE tsc/eslint 0 錯誤。

> 註：`agent/users`（會員管理）沿用既有 `components/admin/*` 與 `dict.admin`，本輪保留於側欄，未移除。買家設定頁的 display_name / 密碼寫入依賴 Supabase 已連線（`profiles` RLS 允許改自己的列）。

### 第四輪調整（2026-07-20，David 指示）— 會員轉換 / 親切聯絡 / 預售屋

- [x] **獨家數據改登入限定**：內頁 `#exclusive` 深色區未登入時值以 `●●●●●` 遮罩（真實資料不進 HTML）+ `blur-sm`，上方覆蓋鎖頭 + 「登入解鎖獨家數據」+ 免費註冊 / 登入 CTA；登入 CTA 帶 `?next=` 回原物件頁（`login/page.tsx` + `LoginForm` 新增安全站內 `next` 轉址，僅接受 `/` 開頭且非 `//`）。
- [x] **右下角浮動聯絡小窗**：`components/contact/contact-widget.tsx` 掛在 `(site)/layout.tsx`，全公開頁常駐（/contact 頁隱藏避免重複）。金色圓鈕 → 深色親切開場（頭像 + 「嗨，我是 {agent} 👋」+ 可問需求文案）+ 姓名/Email/訊息表單 → 免登入 POST /contact 進 agent 收件匣；於物件內頁開啟時自動帶 propertyId 關聯物件。
- [x] **預售屋（pre-construction）**：`Property.is_presale`（BE migration `20260720000001_presale.sql`）；agent 建檔表單新增勾選；listing card 徽章優先序 預售屋 > 新上市 > 銷售中（ink 底金字）；內頁標頭加徽章、側欄 CTA 由「詢問此物件」換成 `RemindMe`（`components/property/remind-me.tsx`：展開姓名/Email 表單 → 以「【預售屋提醒登記】…」訊息寫入 contact_messages，已登入自動預填；之後串 email service 時以此前綴辨識）。
- [x] 字典：`contactWidget.*`、`property.exclusiveLocked* / remind*`、`listings.presaleBadge`、`agentForm.isPresale`（zh-TW / en 同步）。
- [x] 驗證：FE tsc / eslint 0 錯誤、`next build` 41 路由；瀏覽器走查（未登入）首頁與內頁小窗開合與文案、/contact 頁正確隱藏小窗、獨家數據遮罩 + CTA + `next` 連結正確、console / server 皆無錯誤。預售屋 UI 因遠端尚未套用新 migration，僅靜態驗證（見下方手動步驟）。

## 6. ⚠️ 需 David 手動執行

1. ~~套用 `20260710000005_ai_tokens.sql` + `20260716000001_single_agent_pivot.sql`~~ ✅ 2026-07-20 確認已套用（contact_messages / site_settings / favorites / saved_searches 皆存在，品牌資料已種）。
2. **NEW（2026-07-20）**：SQL Editor 執行 `estateengine_be/supabase/migrations/20260720000001_presale.sql`（一行 `alter table properties add column is_presale`）。**套用前 agent 後台儲存物件會因欄位不存在而失敗**，請儘早執行。
