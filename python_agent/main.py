import os
import sys
from dotenv import load_dotenv

# 1. 載入 .env 檔案中的 API 金鑰
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key or api_key == "your_gemini_api_key_here":
    print("❌ 錯誤：請先在 .env 檔案中設定您的 GEMINI_API_KEY！")
    print("💡 提示：前往 https://aistudio.google.com/ 免費申請 API Key。")
    sys.exit(1)

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ 錯誤：未安裝 google-genai 套件，請先執行 `pip install -r requirements.txt`！")
    sys.exit(1)

# 2. 預設的三大角色 System Prompt 模版
PROMPT_TEMPLATES = {
    "1": {
        "name": "📋 產品經理 (PM) 助理",
        "prompt": """你是一位資深科技公司的 Senior Product Manager (PM)，擅長敏捷開發與產品規格撰寫。
你的目標是協助使用者拆解需求、撰寫 User Story 與 PRD (Product Requirement Document)。
回答風格：邏輯嚴謹、善用 Markdown 表格與條列說明、強調問題核心 (What & Why)。"""
    },
    "2": {
        "name": "🎧 電商全能客服專家",
        "prompt": """你是「未來極客科技」的線上客服專員小安。你熱情、親切且極具同理心。
你的目標是解答產品疑問並處理顧客抱怨。
回答風格：語氣溫暖有禮、多用條列步驟解決問題，回應控制在 150 字以內。"""
    },
    "3": {
        "name": "📣 數位行銷文案大師",
        "prompt": """你是一位精通消費者心理學與數位行銷的首席文案大師。
你的目標是撰寫吸引眼球的社群貼文、廣告文案與 AIDA 痛點導購信。
回答風格：具備強烈吸引力、善用爆款標題 A/B Test 與精準的 Call to Action。"""
    }
}

def main():
    print("=" * 60)
    print("🤖 歡迎使用 AI Agent 終端機交談系統 (Powered by Gemini API)")
    print("=" * 60)
    print("\n請選擇您想使用的 Agent 角色預設：")
    print(" [1] 📋 產品經理 (PM) 助理")
    print(" [2] 🎧 電商全能客服專家")
    print(" [3] 📣 數位行銷文案大師")
    print(" [4] ✏️ 自訂 System Prompt")

    choice = input("\n請輸入選項數字 [1-4] (預設為 1): ").strip() or "1"
    
    if choice in PROMPT_TEMPLATES:
        selected_template = PROMPT_TEMPLATES[choice]
        system_instruction = selected_template["prompt"]
        agent_name = selected_template["name"]
    elif choice == "4":
        agent_name = "✏️ 自訂 Agent"
        print("\n請輸入您的 System Prompt (角色設定與行為規範):")
        system_instruction = input("> ").strip()
    else:
        print("⚠️ 無效選項，自動載入 [1] PM 助理角色。")
        system_instruction = PROMPT_TEMPLATES["1"]["prompt"]
        agent_name = PROMPT_TEMPLATES["1"]["name"]

    print(f"\n✅ 已設定角色：{agent_name}")
    print("-" * 60)
    print(f"System Instruction:\n{system_instruction}")
    print("-" * 60)

    # 3. 初始化 Gemini SDK Client
    client = genai.Client(api_key=api_key)

    # 4. 建立多輪對話 Session
    chat = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.4,
        )
    )

    print("\n🚀 Agent 已準備就緒！請開始輸入對話 (輸入 'exit' 或 'quit' 結束對話)\n")

    while True:
        try:
            user_input = input("\n👤 你: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "離開", "結束"]:
                print("\n👋 感謝使用，再見！")
                break

            print(f"\n🤖 {agent_name}: ", end="", flush=True)
            
            # 使用流式輸出 (Streaming)
            response = chat.send_message_stream(user_input)
            for chunk in response:
                print(chunk.text, end="", flush=True)
            print() # 換行

        except KeyboardInterrupt:
            print("\n\n👋 對話已中斷。")
            break
        except Exception as e:
            print(f"\n❌ 發生錯誤: {e}")

if __name__ == "__main__":
    main()
