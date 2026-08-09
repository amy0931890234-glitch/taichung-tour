# 🌿 2026 美東自然風光與尼加拉瀑布 3人慢活自駕之旅 (US East Coast Nature Trip Plan)

本專案提供完整的 **美東 17 天自然與國家公園自駕公路旅行指南**，專為 **家庭 3 人同行（每晚飯店預算不超過 $300 美金含稅）** 設計。包含點對點開車路線指引、一鍵 Google Maps 路線導航按鈕、沿途精選餐館與官網連結、以及各景點據點之飯店訂房連結。

---

## 🚀 核心功能亮點 (Features)

* 🚗 **開車路線指引與一鍵 Maps 導航**：每日行程標示車程時間、里程，並提供一鍵開啟起點與終點的 `Google Maps 導航` 按鈕。
* 🍽️ **沿途精選餐館與美食連結**：每日午晚餐精選熱門餐廳（含星級評分、特色餐食、餐廳官方網站連結及 Google 地圖定位按鈕）。
* 🏨 **3 人每晚 < $300 美金住宿指南**：全行程據點皆篩選 2 Queen Beds 雙大床房或一房一廳套房 (1-Bedroom Suite)，含稅與過夜停車總價控制於每晚 $300 美金內。
* 🌐 **GitHub Pages 一鍵發佈網頁**：基於單一 HTML 與 JavaScript，可直接透過 GitHub Pages 部署成即時公開互動網頁。
* 📱 **全螢幕響應式 UI 設計**：採用現代 Glassmorphism 暗色調/亮色調主題、Leaflet 互動式地圖與分類篩選標籤。

---

## 🛠️ 技術棧說明 (Tech Stack)

* **前端架構**：原生 HTML5 / CSS3 (Vanilla CSS - Glassmorphism Design) / JavaScript ES6
* **地圖與導航**：[Leaflet.js](https://leafletjs.com/) (互動地圖) / Google Maps URL API (路線與地點導航)
* **圖示與字型**：FontAwesome 6.4.0 / Google Fonts (Outfit, Noto Sans TC)

---

## 💻 專案啟動與 GitHub Pages 部署教學 (Quick Start & Deployment)

### 1. 本地開啟
直接按兩下開啟 `index.html`，或使用任何靜態 Web 伺服器開啟。

### 2. GitHub Pages 發佈步驟
1. 將本儲存庫推送到 GitHub：
   ```bash
   git add .
   git commit -m "feat: 更新 3 人預算 $300 美金住宿指南與 Google Maps 路線導航"
   git push -u origin main
   ```
2. 在 GitHub 儲存庫頁面點擊 **Settings** ➔ **Pages**。
3. 在 **Build and deployment** 下方的 **Branch** 選擇 `main`，資料夾選擇 `/ (root)`，點擊 **Save**。
4. 約 1–2 分鐘後即可獲得公開網址 (例：`https://你的帳號.github.io/儲存庫名稱/`)！

---

## 📁 專案目錄結構 (Directory Structure)

```
us-east-trip-2026/
├── index.html                       # 互動式自駕指南主網頁 (包含路線、美食與住宿導航)
├── dc_accommodation_guide.md        # 華盛頓 D.C. 3 人每晚 < $300 美金住宿詳細攻略
├── us_east_road_trip_itinerary.md   # 美東 17 天雙向自然與建築公路旅行規劃表
├── us_east_coast_itinerary.md       # 美東國家公園與頂級步道 16 天健行指南
├── washington_dc_trip_plan.md       # 華盛頓 D.C. 18 天雙人/家庭探親旅遊規劃指南
└── README.md                        # 專案說明文件與 SOP 手冊
```
