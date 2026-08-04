"""
LINE Bot Token 驗證與測試工具
當您取得 Channel Access Token 後，執行此腳本即可測試 Token 是否有效，並取得 Bot 的 ID 與相關資訊。
"""

import sys
import requests

def test_token(token: str):
    print("正在驗證您的 LINE Channel Access Token...")
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # 呼叫 LINE Bot 資訊 API
    url = 'https://api.line.me/v2/bot/info'
    try:
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print("\n✅ Token 驗證成功！LINE 機器人資訊如下：")
            print(f"🤖 機器人名稱 (Display Name): {data.get('displayName')}")
            print(f"🆔 機器人 ID (Bot ID): {data.get('basicId')}")
            print(f"🖼️ 機器人頭像: {data.get('pictureUrl')}")
            print("\n連線正常！您現在可以將此 Token 放入 line_reminder_gas.js 中使用。")
            return True
        else:
            print(f"\n❌ Token 驗證失敗 (錯誤碼 {res.status_code}):")
            print(res.text)
            return False
    except Exception as e:
        print(f"\n❌ 連線發生例外狀況: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        user_token = sys.argv[1]
    else:
        user_token = input("請輸入或貼上您的 Channel Access Token: ").strip()
    
    if user_token:
        test_token(user_token)
    else:
        print("未輸入 Token。")
