# 🐍 Python AI Agent 交談式專案說明

本專案示範如何使用官方最新 `google-genai` SDK 串接 Gemini 2.5 API，並實現具備 **System Prompt 角色引導** 與 **多輪對話歷史** 的 CLI AI Agent。

---

## 🛠️ 安裝與環境設定步驟

### 1. 安裝必要 Python 套件
開啟 Terminal (命令提示字元或 PowerShell)，切換至本目錄並執行：
```bash
pip install -r requirements.txt
```

### 2. 設定 API 金鑰 (API Key)
1. 前往 [Google AI Studio](https://aistudio.google.com/) 取得免費的 Gemini API Key。
2. 開啟目錄下的 `.env` 檔案（若無請將 `.env.example` 複製一份並命名為 `.env`）。
3. 將金鑰貼在 `GEMINI_API_KEY=` 後方：
   ```env
   GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
   ```

---

## 🚀 執行腳本

在 Terminal 輸入以下命令即可啟動 AI Agent：
```bash
python main.py
```

### 🌟 專案亮點與核心功能
1. **多角色切換**：啟動時可選 [1] PM 助理、[2] 電商客服、[3] 行銷文案大師 或 [4] 自訂提示詞。
2. **流式回應 (Streaming Output)**：逐字即時印出 AI 的思維與回答，提供極佳的互動體驗。
3. **多輪對話記憶 (Chat Memory)**：模型自動記住上下文，實現連續追問。
