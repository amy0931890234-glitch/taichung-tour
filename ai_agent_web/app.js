// AI Agent Studio Application Logic

// 1. Role Preset Prompts & Suggestions
const ROLE_PRESETS = {
  pm: {
    title: "PM 產品助理 Agent",
    icon: "fa-list-check",
    prompt: `你是一位資深科技公司的 Senior Product Manager (PM)，擅長敏捷開發 (Agile/Scrum)、使用者體驗設計與產品規格撰寫。
你的目標是協助使用者拆解需求、撰寫 User Story 與 PRD (Product Requirement Document)。

[分析格式規範]
每次分析需求時，請使用以下 Markdown 結構回覆：
## 1. 核心問題與目標 (Problem & Goal)
## 2. 目標使用者 (Target User)
## 3. User Story & 驗收條件 (Acceptance Criteria)
## 4. 建議優先級 (MosCoW 法則)
## 5. 待釐清問題 (Follow-up Questions)`,
    suggestions: [
      "幫我撰寫 App 新增『LINE Pay 快速結帳』功能的 User Story 與驗收條件",
      "使用者反應 App 載入圖片太慢，請協助 PM 拆解改進方案與優先級",
      "我想做一個短影音剪輯 App，請幫我規劃 MVP (最小可行性產品) 規格範疇"
    ]
  },
  cs: {
    title: "電商客服專家 Agent",
    icon: "fa-headset",
    prompt: `你是「未來極客科技」的線上客服專員小安。你熱情、親切且極具同理心。
你的目標是解答顧客關於產品功能、物流進度、退換貨政策的疑問。

[處理原則]
- 語氣：親切有禮，溫暖適度使用 Emoji (😊, 👍)。
- 客訴原則：先表達理解與歉意 (LAST 原則)，切勿生硬反駁。
- 字數控制：控制在 150 字以內，清晰條列解決步驟。`,
    suggestions: [
      "顧客收到商品發現外包裝破損且商品有刮痕，非常生氣要退貨，該怎麼回覆？",
      "顧客詢問：下單後大概幾天可以收到貨？運費怎麼計算？",
      "顧客買錯衣服尺寸要求換貨，請提供標準溫暖的處理流程回覆"
    ]
  },
  marketing: {
    title: "行銷文案大師 Agent",
    icon: "fa-bullhorn",
    prompt: `你是一位精通消費者心理學與數位行銷的首席文案大師。
你的目標是撰寫吸引眼球的社群貼文、廣告文案與 AIDA 痛點導購信。

[輸出結構規範]
請提供：
1. 💡 3 個爆款標題選擇 (A/B/C Test)
2. 📝 正文內容 (包含 Hook 鉤子、痛點共鳴、解決方案)
3. 🚀 行動呼籲 (Call to Action / CTA)
4. 🏷️ 推薦 Hashtags (5~8 個)`,
    suggestions: [
      "請為一款主打『無線降噪耳機』撰寫 IG 爆款推廣貼文",
      "我想推廣線上 AI 課程，請使用 AIDA 框架撰寫一篇強力的導購 Email",
      "幫我的手作烘焙工作室設計 3 個吸引年輕人的社群行銷切入點與標題"
    ]
  },
  custom: {
    title: "自訂 Agent",
    icon: "fa-sliders",
    prompt: "請在此輸入您自訂的 AI Agent 角色身分、任務描述與對話規範...",
    suggestions: [
      "你是我的 Python 程式碼導師，請幫我重構以下 Code...",
      "你是我的英文面試官，請為我進行模擬口試問答..."
    ]
  }
};

// 2. State Management
let currentRole = "pm";
let chatHistory = [];
let isGenerating = false;

// 3. DOM Elements
const themeToggle = document.getElementById("themeToggle");
const apiKeyInput = document.getElementById("apiKeyInput");
const toggleKeyVisibility = document.getElementById("toggleKeyVisibility");
const roleCards = document.querySelectorAll(".role-card");
const systemPromptInput = document.getElementById("systemPrompt");
const resetPromptBtn = document.getElementById("resetPromptBtn");
const tempSlider = document.getElementById("tempSlider");
const tempValue = document.getElementById("tempValue");
const modelSelect = document.getElementById("modelSelect");
const clearChatBtn = document.getElementById("clearChatBtn");

const agentTitle = document.getElementById("agentTitle");
const agentAvatar = document.getElementById("agentAvatar");
const chatMessages = document.getElementById("chatMessages");
const welcomeCard = document.getElementById("welcomeCard");
const starterSuggestions = document.getElementById("starterSuggestions");
const typingIndicator = document.getElementById("typingIndicator");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// 4. Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadSavedSettings();
  setupEventListeners();
  switchRole(currentRole, false);
});

// Load Settings from LocalStorage
function loadSavedSettings() {
  const savedKey = localStorage.getItem("gemini_api_key");
  if (savedKey) apiKeyInput.value = savedKey;

  const savedTheme = localStorage.getItem("app_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  const savedModel = localStorage.getItem("gemini_model");
  if (savedModel) modelSelect.value = savedModel;
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector("i");
  if (theme === "dark") {
    icon.className = "fa-solid fa-sun";
  } else {
    icon.className = "fa-solid fa-moon";
  }
}

// Setup Event Handlers
function setupEventListeners() {
  // Theme Switcher
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app_theme", newTheme);
    updateThemeIcon(newTheme);
  });

  // API Key Saving
  apiKeyInput.addEventListener("input", (e) => {
    localStorage.setItem("gemini_api_key", e.target.value.trim());
  });

  toggleKeyVisibility.addEventListener("click", () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
    toggleKeyVisibility.querySelector("i").className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  });

  // Role Selection
  roleCards.forEach(card => {
    card.addEventListener("click", () => {
      roleCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const roleKey = card.getAttribute("data-role");
      switchRole(roleKey, true);
    });
  });

  // Reset System Prompt Button
  resetPromptBtn.addEventListener("click", () => {
    if (ROLE_PRESETS[currentRole]) {
      systemPromptInput.value = ROLE_PRESETS[currentRole].prompt;
    }
  });

  // Temperature Slider
  tempSlider.addEventListener("input", (e) => {
    tempValue.textContent = e.target.value;
  });

  // Model Selector
  modelSelect.addEventListener("change", (e) => {
    localStorage.setItem("gemini_model", e.target.value);
  });

  // Clear Chat History
  clearChatBtn.addEventListener("click", () => {
    chatHistory = [];
    renderChatMessages();
  });

  // Auto-resize User Textarea
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
  });

  // Send Message on Enter
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);
}

// Switch Role Action
function switchRole(roleKey, resetPrompt = true) {
  currentRole = roleKey;
  const roleData = ROLE_PRESETS[roleKey] || ROLE_PRESETS.pm;

  // Update Title & Avatar
  agentTitle.textContent = roleData.title;
  agentAvatar.innerHTML = `<i class="fa-solid ${roleData.icon}"></i>`;

  // Update Prompt Input if requested
  if (resetPrompt) {
    systemPromptInput.value = roleData.prompt;
  }

  // Update Starter Suggestions
  renderStarterSuggestions(roleData.suggestions);
}

// Render Starter Suggestions
function renderStarterSuggestions(suggestions) {
  starterSuggestions.innerHTML = "";
  suggestions.forEach(text => {
    const btn = document.createElement("button");
    btn.className = "starter-btn";
    btn.innerHTML = `<span>${text}</span> <i class="fa-solid fa-arrow-right"></i>`;
    btn.addEventListener("click", () => {
      userInput.value = text;
      sendMessage();
    });
    starterSuggestions.appendChild(btn);
  });
}

// Send Message Handler
async function sendMessage() {
  const messageText = userInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!messageText) return;

  if (!apiKey) {
    alert("⚠️ 請先在左側邊欄輸入您的 Gemini API Key！");
    apiKeyInput.focus();
    return;
  }

  if (isGenerating) return;

  // Hide welcome card if present
  if (welcomeCard) welcomeCard.style.display = "none";

  // Append User Message to UI & History
  addMessageToUI("user", messageText);
  chatHistory.push({ role: "user", parts: [{ text: messageText }] });

  // Clear Input Box
  userInput.value = "";
  userInput.style.height = "auto";

  // Show Typing Indicator
  isGenerating = true;
  typingIndicator.classList.remove("hidden");
  scrollToBottom();

  try {
    const model = modelSelect.value;
    const temperature = parseFloat(tempSlider.value);
    const systemPrompt = systemPromptInput.value.trim();

    // Call Gemini REST API
    const responseText = await callGeminiAPI({
      apiKey,
      model,
      systemPrompt,
      temperature,
      contents: chatHistory
    });

    // Add AI Response to UI & History
    addMessageToUI("ai", responseText);
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });

  } catch (error) {
    console.error("Gemini API Error:", error);
    addMessageToUI("ai", `❌ **發生錯誤**: ${error.message || "無法連線至 Gemini API，請檢查金鑰與網路連線。"}`);
  } finally {
    isGenerating = false;
    typingIndicator.classList.add("hidden");
    scrollToBottom();
  }
}

// Gemini REST API Fetch Function
async function callGeminiAPI({ apiKey, model, systemPrompt, temperature, contents }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: contents,
    generationConfig: {
      temperature: temperature
    }
  };

  if (systemPrompt) {
    payload.system_instruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status} Error`);
  }

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("模型傳回空白回應或格式異常。");
  }
}

// Add Message Row to UI
function addMessageToUI(role, content) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.innerHTML = role === "user" ? `<i class="fa-solid fa-user"></i>` : `<i class="fa-solid fa-robot"></i>`;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  if (role === "ai") {
    // Parse Markdown for AI Response
    bubble.innerHTML = marked.parse(content);
  } else {
    // Escape text for User Message
    bubble.textContent = content;
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatMessages.appendChild(row);

  scrollToBottom();
}

// Render Chat Messages
function renderChatMessages() {
  chatMessages.innerHTML = "";
  if (chatHistory.length === 0) {
    chatMessages.appendChild(welcomeCard);
    welcomeCard.style.display = "block";
    return;
  }

  chatHistory.forEach(msg => {
    const role = msg.role === "user" ? "user" : "ai";
    const text = msg.parts[0]?.text || "";
    addMessageToUI(role, text);
  });
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
