# LINE 群組到期提醒 Bot 建置與 Token 取得指南 (最新版)

> [!NOTE]
> LINE 官方目前已更新規範：**Messaging API 無法直接在 Developers Console 建立，必須先透過「LINE 官方帳號管理後台」建立官方帳號後再開啟 API 權限**。

---

## 🚀 完整 4 步驟流程 (圖文說明)

### 步驟 1：點擊畫面上的綠色按鈕建立官方帳號
1. 點擊您目前畫面上的綠色按鈕 **「Create a LINE Official Account」** (或直接開啟 [LINE 官方帳號管理後台](https://manager.line.biz/))。
2. 填寫帳號基本資料（全中文介面）：
   - **帳號名稱**：提醒小幫手 (或任意名稱)
   - **主要產業 / 副產業**：隨意選擇（如：公司 / 商業服務）
3. 點選 **「確認」** -> **「建立帳號」**。

---

### 步驟 2：開啟 Messaging API 功能
1. 建立完成後，畫面會進入 LINE 官方帳號後台。
2. 點擊右上角的 **「設定 ⚙️ (齒輪圖示)」**。
3. 在左側選單點選 **「Messaging API」**。
4. 點擊 **「啟用 Messaging API」** 按鈕：
   - **服務提供者 (Provider)**：選擇現有的，或輸入新名字（例如：`公司提醒`）。
   - 點擊確認。

---

### 步驟 3：在 LINE Developers 取得 Channel Access Token
1. 啟用後，頁面上會出現 **LINE Developers Console** 的連結，點擊連回 Developers Console。
2. 點擊進入您剛建立的 Channel，切換到 **Messaging API** 分頁：
   - 找到 **Allow bot to join group chats**，點擊 Edit 改為 `Enabled` (允許機器人加入 4 人群組)。
   - 拉到頁面最下方，找到 **Channel access token (long-lived)**，點擊 **Issue** 按鈕。
   - 複製這一長串 Token，這就是程式碼需要的密鑰！

---

### 步驟 4：將 Bot 邀請加入您的 4 人群組
1. 在 Messaging API 頁面上方會看到 Bot 的 **QR Code**。
2. 用手機 LINE 掃描 QR Code 加為好友，並將 Bot **邀請加入您的 4 人 LINE 群組**！
