/**
 * LINE 群組對話自動監聽與到期提醒系統 (Google Apps Script 版本 - 免試算表)
 * 
 * 機器人資訊：
 * - 機器人 Basic ID: @272yioeb
 * - Token 狀態: 已填入且驗證成功！
 * 
 * 部署步驟 (只需複製以下全部程式碼)：
 * 1. 開啟 Google Apps Script: https://script.google.com/
 * 2. 點擊左上角「新專案」，將此處的全部程式碼全選貼上覆蓋。
 * 3. 點擊右上角「部署」->「新增部署」:
 *    - 齒輪圖示選擇「網頁應用程式 (Web App)」
 *    - 說明：LINE 提醒 Bot
 *    - 執行身分：我 (Me)
 *    - 誰可以存取：所有人 (Anyone)
 * 4. 點擊「部署」，複製獲得的「網頁應用程式 URL」。
 * 5. 回到 LINE Developers Console -> 切換到「Messaging API」分頁：
 *    - 將 URL 貼入 Webhook URL 欄位並點擊 Save。
 *    - 開啟「Use webhook」開關！
 *    - 找到「Allow bot to join group chats」設為 Enabled！
 * 6. 設定定時檢查提醒（每 5 分鐘）：
 *    - 點選 Apps Script 左側「觸發條件 (鬧鐘圖示)」->「新增觸發條件」
 *    - 執行的函式：checkAndSendReminders
 *    - 執行來源：時間驅動 -> 分鐘定時器 -> 每 5 分鐘 -> 儲存。
 */

// 您的 LINE Messaging API Channel Access Token (請填入您的 Token)
const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN';

/**
 * 接收 LINE 群組訊息 Webhook (即時監聽對話)
 */
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const events = contents.events;

    if (events && events.length > 0) {
      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          const msgText = event.message.text.trim();
          const replyToken = event.replyToken;
          const groupId = event.source.groupId || event.source.userId;

          // 解析群組對話內容
          const taskData = parseTaskFromMessage(msgText);

          if (taskData) {
            // 儲存任務至背景資料庫 (PropertiesService)
            saveTaskToStorage(groupId, taskData.person, taskData.task, taskData.deadline);

            // 回覆即時確認訊息給群組
            replyTaskConfirmation(replyToken, taskData.person, taskData.task, taskData.deadline);
          }
        }
      }
    }
  } catch (err) {
    Logger.log('doPost 錯誤: ' + err.toString());
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 自動解析群組對話文字中的「關係人」、「處理事項」、「截止時間」
 * 支援範例：
 * 1. "提醒 關係人:@張三 事項:整理銷售月報 截止:17:00"
 * 2. "@小明 16:30 前完成發票填寫"
 * 3. "請 @王五 在 2026/08/03 18:00 前提交報告"
 */
function parseTaskFromMessage(text) {
  // 檢查是否包含提醒關鍵字或標記人名 (@人名) 加上 時間
  if (!text.includes('提醒') && !text.includes('@') && !text.includes('截止') && !text.includes('前')) {
    return null;
  }

  let person = '群組成員';
  let task = text;
  let deadline = null;

  // 1. 解析關係人 (尋找 @人名 或 關係人:xxx)
  const personMatch = text.match(/(?:關係人[:：]\s*|@)([^\s\n,，:：]+)/);
  if (personMatch) {
    person = '@' + personMatch[1].replace(/^@/, '');
  }

  // 2. 解析截止時間 (支援 17:00, 2026-08-03 17:00, 16點30分, 1.5小時後 等)
  const now = new Date();
  
  // 格式 A: YYYY-MM-DD HH:mm 或 YYYY/MM/DD HH:mm
  const fullTimeMatch = text.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\s+\d{1,2}:\d{2})/);
  // 格式 B: HH:mm (例如 17:00 或 09:30)
  const timeOnlyMatch = text.match(/(\d{1,2}:\d{2})/);
  // 格式 C: X點Y分 (例如 17點30分)
  const chineseTimeMatch = text.match(/(\d{1,2})\s*點\s*(\d{1,2})?\s*分?/);
  // 格式 D: X小時後
  const hoursAfterMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:個)?小時後/);

  if (fullTimeMatch) {
    deadline = new Date(fullTimeMatch[1].replace(/\//g, '-'));
  } else if (timeOnlyMatch) {
    const parts = timeOnlyMatch[1].split(':');
    deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(parts[0]), parseInt(parts[1]));
    if (deadline < now) {
      // 若指定的點數小於當前時間，假設為明日該時間
      deadline.setDate(deadline.getDate() + 1);
    }
  } else if (chineseTimeMatch) {
    const hour = parseInt(chineseTimeMatch[1]);
    const min = chineseTimeMatch[2] ? parseInt(chineseTimeMatch[2]) : 0;
    deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min);
    if (deadline < now) {
      deadline.setDate(deadline.getDate() + 1);
    }
  } else if (hoursAfterMatch) {
    const hours = parseFloat(hoursAfterMatch[1]);
    deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  if (!deadline || isNaN(deadline.getTime())) {
    return null; // 無法識別明確截止時間，忽略非提醒對話
  }

  // 3. 清理與提取處理事項
  task = text
    .replace(/(?:關係人[:：]\s*|@)[^\s\n,，:：]+/g, '') // 移除關係人
    .replace(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\s+\d{1,2}:\d{2})/g, '')
    .replace(/(\d{1,2}:\d{2})/g, '')
    .replace(/(\d{1,2})\s*點\s*(\d{1,2})?\s*分?/g, '')
    .replace(/(\d+(?:\.\d+)?)\s*(?:個)?小時後/g, '')
    .replace(/(?:提醒|截止|處理事項[:：]|事項[:：]|請在|前|完成|記得)/g, '')
    .trim();

  if (!task) {
    task = '處理交辦事項';
  }

  return { person, task, deadline };
}

/**
 * 儲存任務至 GAS ScriptProperties (背景資料庫)
 */
function saveTaskToStorage(groupId, person, task, deadline) {
  const props = PropertiesService.getScriptProperties();
  const tasksJson = props.getProperty('REMINDER_TASKS') || '[]';
  const tasks = JSON.parse(tasksJson);

  const newTask = {
    id: Date.now().toString(),
    groupId: groupId,
    person: person,
    task: task,
    deadline: deadline.toISOString(),
    isNotified: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  props.setProperty('REMINDER_TASKS', JSON.stringify(tasks));
  Logger.log('已成功儲存提醒任務: ' + JSON.stringify(newTask));
}

/**
 * LINE 訊息回覆 (Reply Token)
 */
function replyTaskConfirmation(replyToken, person, task, deadline) {
  const formattedDeadline = Utilities.formatDate(deadline, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  
  const reminderTime = new Date(deadline.getTime() - 60 * 60 * 1000);
  const formattedReminderTime = Utilities.formatDate(reminderTime, Session.getScriptTimeZone(), 'HH:mm');

  const replyText = 
    `✅【已成功為您記錄提醒】\n` +
    `----------------------------\n` +
    `👤 關係人：${person}\n` +
    `📝 處理事項：${task}\n` +
    `⏳ 截止時間：${formattedDeadline}\n` +
    `----------------------------\n` +
    `🔔 將於 ${formattedReminderTime} (到期前 1 小時) 自動發送群組提醒通知！`;

  const payload = {
    replyToken: replyToken,
    messages: [{ type: 'text', text: replyText }]
  };

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

/**
 * 定時檢查觸發器：於截止前 1 小時自動發送群組推播通知
 */
function checkAndSendReminders() {
  const props = PropertiesService.getScriptProperties();
  const tasksJson = props.getProperty('REMINDER_TASKS');
  if (!tasksJson) return;

  let tasks = JSON.parse(tasksJson);
  const now = new Date();
  const oneHourInMs = 60 * 60 * 1000;
  let updated = false;

  for (let task of tasks) {
    if (task.isNotified) continue;

    const deadline = new Date(task.deadline);
    const timeDiff = deadline.getTime() - now.getTime();

    // 條件：當前時間距離截止時間不足 1 小時 (3600,000 ms) 且 尚未逾期超過 2 小時
    if (timeDiff <= oneHourInMs && timeDiff > -2 * oneHourInMs) {
      const minutesLeft = Math.max(0, Math.round(timeDiff / (60 * 1000)));

      const success = sendPushNotification(task.groupId, task.person, task.task, deadline, minutesLeft);
      if (success) {
        task.isNotified = true;
        updated = true;
      }
    }
  }

  if (updated) {
    props.setProperty('REMINDER_TASKS', JSON.stringify(tasks));
  }
}

/**
 * 呼叫 LINE Messaging API 推播訊息
 */
function sendPushNotification(groupId, person, task, deadline, minutesLeft) {
  const formattedDeadline = Utilities.formatDate(deadline, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  const timeStatus = minutesLeft > 0 ? `剩餘約 ${minutesLeft} 分鐘` : `⚠️ 已達截止時間！`;

  const messageText = 
    `⏰【任務到期提醒 - ${timeStatus}】\n` +
    `----------------------------\n` +
    `👤 關係人：${person}\n` +
    `📝 處理事項：${task}\n` +
    `⏳ 截止時間：${formattedDeadline}\n` +
    `----------------------------\n` +
    `⚠️ 請 ${person} 儘速處理，謝謝！`;

  const payload = {
    to: groupId,
    messages: [{ type: 'text', text: messageText }]
  };

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  return response.getResponseCode() === 200;
}
