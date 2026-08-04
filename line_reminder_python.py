"""
LINE 群組對話監聽與到期提醒系統 (Python FastAPI / Flask 版本)

功能說明：
1. 免試算表！建立 Webhook 伺服器，即時監聽 4 人 LINE 群組的對話訊息。
2. 自動識別對話中的「關係人」、「處理事項」、「截止時間」，即時回覆確認卡片。
3. 每 1 分鐘由 APScheduler 掃描 SQLite 資料庫，於「截止時間前 1 小時」發送推播通知。

安裝依賴：
pip install fastapi uvicorn line-bot-sdk apscheduler requests
"""

import re
import sqlite3
import requests
import logging
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, BackgroundTasks
from apscheduler.schedulers.background import BackgroundScheduler

# ================= 設定區 =================
LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE'
DB_FILE = 'tasks.db'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app = FastAPI()

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id TEXT NOT NULL,
            person TEXT NOT NULL,
            task TEXT NOT NULL,
            deadline DATETIME NOT NULL,
            is_reminded INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def parse_task_from_message(text: str):
    """從 LINE 群組對話文字中自動解析 關係人、事項、截止時間"""
    if not any(k in text for k in ['提醒', '@', '截止', '前']):
        return None

    person = "群組成員"
    person_match = re.search(r'(?:關係人[:：]\s*|@)([^\s\n,，:：]+)', text)
    if person_match:
        person = f"@{person_match.group(1).lstrip('@')}"

    now = datetime.now()
    deadline = None

    # 17:00 格式
    time_match = re.search(r'(\d{1,2}:\d{2})', text)
    # 2026-08-03 17:00 格式
    full_match = re.search(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2})', text)
    # X點Y分 格式
    chinese_time_match = re.search(r'(\d{1,2})\s*點\s*(\d{1,2})?\s*分?', text)

    if full_match:
        deadline = datetime.strptime(full_match.group(1).replace('/', '-'), '%Y-%m-%d %H:%M')
    elif time_match:
        parts = time_match.group(1).split(':')
        deadline = now.replace(hour=int(parts[0]), minute=int(parts[1]), second=0, microsecond=0)
        if deadline < now:
            deadline += timedelta(days=1)
    elif chinese_time_match:
        hour = int(chinese_time_match.group(1))
        minute = int(chinese_time_match.group(2)) if chinese_time_match.group(2) else 0
        deadline = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if deadline < now:
            deadline += timedelta(days=1)

    if not deadline:
        return None

    # 清理事項文字
    cleaned_task = re.sub(r'(?:關係人[:：]\s*|@)[^\s\n,，:：]+', '', text)
    cleaned_task = re.sub(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2})', '', cleaned_task)
    cleaned_task = re.sub(r'(\d{1,2}:\d{2})', '', cleaned_task)
    cleaned_task = re.sub(r'(\d{1,2})\s*點\s*(\d{1,2})?\s*分?', '', cleaned_task)
    cleaned_task = re.sub(r'(?:提醒|截止|處理事項[:：]|事項[:：]|請在|前|完成|記得)', '', cleaned_task).strip()

    if not cleaned_task:
        cleaned_task = "處理交辦事項"

    return {
        "person": person,
        "task": cleaned_task,
        "deadline": deadline.strftime('%Y-%m-%d %H:%M:%S')
    }

def reply_line_message(reply_token: str, text: str):
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {LINE_CHANNEL_ACCESS_TOKEN}'}
    payload = {'replyToken': reply_token, 'messages': [{'type': 'text', 'text': text}]}
    requests.post('https://api.line.me/v2/bot/message/reply', json=payload, headers=headers)

def send_push_message(group_id: str, text: str):
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {LINE_CHANNEL_ACCESS_TOKEN}'}
    payload = {'to': group_id, 'messages': [{'type': 'text', 'text': text}]}
    res = requests.post('https://api.line.me/v2/bot/message/push', json=payload, headers=headers)
    return res.status_code == 200

@app.post("/webhook")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    events = data.get("events", [])
    
    for event in events:
        if event.get("type") == "message" and event.get("message", {}).get("type") == "text":
            msg_text = event["message"]["text"]
            reply_token = event["replyToken"]
            group_id = event["source"].get("groupId") or event["source"].get("userId")
            
            parsed = parse_task_from_message(msg_text)
            if parsed:
                # 寫入 SQLite
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO tasks (group_id, person, task, deadline) VALUES (?, ?, ?, ?)',
                    (group_id, parsed["person"], parsed["task"], parsed["deadline"])
                )
                conn.commit()
                conn.close()

                # 即時回覆確認
                confirm_msg = (
                    f"✅【已成功記錄提醒】\n"
                    f"----------------------------\n"
                    f"👤 關係人：{parsed['person']}\n"
                    f"📝 處理事項：{parsed['task']}\n"
                    f"⏳ 截止時間：{parsed['deadline']}\n"
                    f"----------------------------\n"
                    f"🔔 將於到期前 1 小時自動在群組發送提醒通知！"
                )
                reply_line_message(reply_token, confirm_msg)

    return {"status": "ok"}

def check_and_send_reminders():
    """APScheduler 排程：每 1 分鐘檢查並於 1 小時前發送通知"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id, group_id, person, task, deadline FROM tasks WHERE is_reminded = 0')
    rows = cursor.fetchall()
    
    now = datetime.now()
    one_hour = timedelta(hours=1)
    
    for row in rows:
        task_id, group_id, person, task, deadline_str = row
        deadline = datetime.strptime(deadline_str, '%Y-%m-%d %H:%M:%S')
        time_diff = deadline - now

        if time_diff <= one_hour and time_diff >= timedelta(hours=-2):
            minutes_left = max(0, int(time_diff.total_seconds() // 60))
            time_status = f"剩餘約 {minutes_left} 分鐘" if minutes_left > 0 else "⚠️ 已達截止時間！"
            
            msg = (
                f"⏰【任務到期提醒 - {time_status}】\n"
                f"----------------------------\n"
                f"👤 關係人：{person}\n"
                f"📝 處理事項：{task}\n"
                f"⏳ 截止時間：{deadline_str}\n"
                f"----------------------------\n"
                f"⚠️ 請 {person} 儘速處理，謝謝！"
            )
            
            if send_push_message(group_id, msg):
                cursor.execute('UPDATE tasks SET is_reminded = 1 WHERE id = ?', (task_id,))
                conn.commit()

    conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_and_send_reminders, 'interval', minutes=1)
scheduler.start()

if __name__ == '__main__':
    init_db()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
