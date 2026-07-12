/* Blitz and AI Arena Battle Mode Module */

const BACKUP_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "tencent/hy3:free",
  "poolside/laguna-xs-2.1:free",
];

// Module level state
let isBattleActive = false;
let isBlitzActive = false;
let aiResults = null;
let battleQuestions = [];
let userSelectedChoices = [];
let battleTimeLimit = 60;
let battleTimer = null;
let isUserFinished = false;
// Get API key from global configuration or localStorage
function getOrchestrationApiKey() {
  const globalKey = window.OPENROUTER_CONFIG?.apiKey || "";
  const storedKey = localStorage.getItem('avtotest_openrouter_key') || "";
  return storedKey || globalKey;
}

// Expose checks globally
window.isBattleModeActive = () => isBattleActive || isBlitzActive;

function safeDisplayQuestion() {
  const renderFunc = window.displayQuestion || window.renderQuestion || window.displayCurrentQuestion;
  if (typeof renderFunc === 'function') {
    renderFunc();
  } else {
    console.error("Native question renderer function not found in global scope.");
  }
}
window.recordBattleChoice = (optIndex) => {
  if (isBattleActive || isBlitzActive) {
    userSelectedChoices[window.currentQuestionIndex] = optIndex;
    window.currentQuestionIndex++;
    if (window.currentQuestionIndex < window.filteredQuestions.length) {
      window.selectedAnswer = null;
      safeDisplayQuestion();
    } else {
      finishUserSession();
    }
    return true;
  }
  return false;
};

// OpenRouter Fetcher with Fallback
async function fetchAIAnswersWithFallback(customModelName, questionsBundle, apiKey) {
  let modelsToTry = [customModelName, ...BACKUP_MODELS].filter(Boolean);
  modelsToTry = [...new Set(modelsToTry)];
  
  let lastError = null;
  for (let model of modelsToTry) {
    try {
      console.log(`Querying OpenRouter with model: ${model}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://github.com/mansurxongemini/avtotest",
          "X-Title": "Avto Test"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an expert driving instructor. Solve these Uzbek driving test questions. Return ONLY a valid JSON object matching the schema: { \"answers\": [number, number, ...] } where each number is the 0-indexed correct option index for each question in order. Do not return any other text, reasoning, or markdown wrapper."
            },
            {
              role: "user",
              content: makePrompt(questionsBundle)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No choices returned from OpenRouter.");
      }

      const reply = data.choices[0].message.content.trim();
      const cleaned = reply.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed || !Array.isArray(parsed.answers)) {
        throw new Error("Response JSON missing 'answers' list.");
      }

      if (parsed.answers.length !== questionsBundle.length) {
        throw new Error(`Expected ${questionsBundle.length} answers, received ${parsed.answers.length}`);
      }

      return {
        modelUsed: model,
        answers: parsed.answers
      };
    } catch (err) {
      console.warn(`Model ${model} failed:`, err);
      lastError = err;
      if (window.showToast) {
        window.showToast(`${model.split('/').pop()} xatolik berdi, keyingisiga o'tilmoqda...`);
      }
    }
  }
  throw lastError || new Error("Barcha AI modellari xatolik berdi.");
}

// Simulated AI fallback
async function simulateAIAnswers(questionsBundle) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const answers = [];
  questionsBundle.forEach(q => {
    const opts = window.Answers.filter(ans => ans.oraliq_dars_question === q.id);
    const correctOptIdx = opts.findIndex(o => o.is_true);
    
    // Simulate 80% accuracy
    if (Math.random() < 0.8) {
      answers.push(correctOptIdx);
    } else {
      const incorrectIndices = [];
      opts.forEach((o, idx) => {
        if (idx !== correctOptIdx) incorrectIndices.push(idx);
      });
      const randIdx = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)] ?? 0;
      answers.push(randIdx);
    }
  });
  return {
    modelUsed: "local/simulated-instructor",
    answers: answers
  };
}

function makePrompt(questionsBundle) {
  let promptContent = "Quyidagi test savollarini yeching:\n\n";
  questionsBundle.forEach((q, idx) => {
    promptContent += `Savol ${idx + 1}: ${q.uz}\n`;
    const opts = window.Answers.filter(ans => ans.oraliq_dars_question === q.id);
    opts.forEach((opt, optIdx) => {
      promptContent += `  ${optIdx}) ${opt.uz_ans}\n`;
    });
    promptContent += "\n";
  });
  promptContent += "Return valid JSON object: { \"answers\": [0, 2, ...] }";
  return promptContent;
}

// Timer management
function startBattleTimer(seconds) {
  let remaining = seconds;
  const timerEl = document.getElementById('timer');
  if (timerEl) {
    timerEl.style.display = 'block';
    timerEl.innerText = formatTime(remaining);
  }
  
  if (battleTimer) clearInterval(battleTimer);
  battleTimer = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.innerText = formatTime(remaining);
    
    if (remaining <= 0) {
      clearInterval(battleTimer);
      if (window.showToast) window.showToast("Vaqt tugadi!");
      finishUserSession();
    }
  }, 1000);
}

function formatTime(secs) {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s < 10 ? '0' : ''}${s}`;
}

// User finish callback
function finishUserSession() {
  if (battleTimer) clearInterval(battleTimer);
  isUserFinished = true;
  
  if (!aiResults) {
    const overlay = document.getElementById('battle-blur-overlay');
    if (overlay) overlay.style.display = 'flex';
  } else {
    renderSplitScreen();
  }
}

// Split Screen view rendering
function renderSplitScreen() {
  const overlay = document.getElementById('battle-blur-overlay');
  if (overlay) overlay.style.display = 'none';
  
  if (window.questionInterface) window.questionInterface.style.display = 'none';
  if (window.backButton) window.backButton.style.display = 'inline-flex';
  
  const existingSplit = document.querySelector('.battle-split-container');
  if (existingSplit) existingSplit.remove();
  
  const container = document.createElement('div');
  container.className = 'battle-split-container';
  
  // Calculate User Stats
  let userCorrect = 0;
  let userIncorrect = 0;
  battleQuestions.forEach((q, idx) => {
    const userChoice = userSelectedChoices[idx];
    const opts = window.Answers.filter(ans => ans.oraliq_dars_question === q.id);
    const correctOptIdx = opts.findIndex(o => o.is_true);
    if (userChoice === correctOptIdx) {
      userCorrect++;
    } else {
      userIncorrect++;
    }
  });
  
  // Calculate AI Stats
  let aiCorrect = 0;
  let aiIncorrect = 0;
  battleQuestions.forEach((q, idx) => {
    const aiChoice = aiResults ? aiResults.answers[idx] : -1;
    const opts = window.Answers.filter(ans => ans.oraliq_dars_question === q.id);
    const correctOptIdx = opts.findIndex(o => o.is_true);
    if (aiChoice === correctOptIdx) {
      aiCorrect++;
    } else {
      aiIncorrect++;
    }
  });
  
  // User Pane Items
  let userQuestionsHtml = "";
  battleQuestions.forEach((q, idx) => {
    const userChoice = userSelectedChoices[idx];
    const opts = window.Answers.filter(ans => ans.oraliq_dars_question === q.id);
    const correctOptIdx = opts.findIndex(o => o.is_true);
    const userChoiceText = userChoice !== undefined && opts[userChoice] ? (opts[userChoice].answer_uz || opts[userChoice].answer || "Javob berilmadi") : "Javob berilmadi";
    const correctChoiceText = opts[correctOptIdx] ? (opts[correctOptIdx].answer_uz || opts[correctOptIdx].answer || "") : "";
    const isCorrect = userChoice === correctOptIdx;
    
    userQuestionsHtml += `
      <div class="battle-question-item">
        <div class="battle-question-title">${idx + 1}. ${q.question_uz || q.question || 'Savol matni topilmadi'}</div>
        <div class="battle-choice-row">
          <span class="battle-choice-badge badge-user">Sizning tanlovingiz:</span>
          <span>${userChoiceText}</span>
        </div>
        <div class="battle-choice-row">
          <span class="battle-choice-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}">
            ${isCorrect ? 'To\'g\'ri ✓' : 'Noto\'g\'ri ✗'}
          </span>
          ${!isCorrect ? `<span>(To'g'ri: ${correctChoiceText})</span>` : ""}
        </div>
      </div>
    `;
  });
  
  // AI Pane Items
  let aiQuestionsHtml = "";
  battleQuestions.forEach((q, idx) => {
    const aiChoice = aiResults ? aiResults.answers[idx] : -1;
    const opts = window.Answers.filter(ans => ans.oraliq_dars_question === q.id);
    const correctOptIdx = opts.findIndex(o => o.is_true);
    const aiChoiceText = aiChoice !== -1 && opts[aiChoice] ? (opts[aiChoice].answer_uz || opts[aiChoice].answer || "Javob berilmadi") : "Javob berilmadi";
    const correctChoiceText = opts[correctOptIdx] ? (opts[correctOptIdx].answer_uz || opts[correctOptIdx].answer || "") : "";
    const isCorrect = aiChoice === correctOptIdx;
    
    aiQuestionsHtml += `
      <div class="battle-question-item">
        <div class="battle-question-title">${idx + 1}. ${q.question_uz || q.question || 'Savol matni topilmadi'}</div>
        <div class="battle-choice-row">
          <span class="battle-choice-badge badge-ai">AI tanlovi:</span>
          <span>${aiChoiceText}</span>
        </div>
        <div class="battle-choice-row">
          <span class="battle-choice-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}">
            ${isCorrect ? 'To\'g\'ri ✓' : 'Noto\'g\'ri ✗'}
          </span>
          ${!isCorrect ? `<span>(To'g'ri: ${correctChoiceText})</span>` : ""}
        </div>
      </div>
    `;
  });

  const aiModelFriendlyName = aiResults ? aiResults.modelUsed.split('/').pop().toUpperCase() : "AI MODEL";
  
  container.innerHTML = `
    <div class="pane user-pane">
      <div class="pane-title">Sizning Natijangiz</div>
      <div class="battle-summary-stats">
        <div class="stat-box">
          <div class="stat-val" style="color: #14a800;">${userCorrect}</div>
          <div class="stat-label">To'g'ri</div>
        </div>
        <div class="stat-box">
          <div class="stat-val" style="color: #f5222d;">${userIncorrect}</div>
          <div class="stat-label">Noto'g'ri</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${Math.round((userCorrect / battleQuestions.length) * 100)}%</div>
          <div class="stat-label">Foiz</div>
        </div>
      </div>
      <div class="battle-questions-list">
        ${userQuestionsHtml}
      </div>
    </div>
    
    <div class="pane ai-pane">
      <div class="pane-title">🤖 ${aiModelFriendlyName} Natijangiz</div>
      <div class="battle-summary-stats">
        <div class="stat-box">
          <div class="stat-val" style="color: #14a800;">${aiCorrect}</div>
          <div class="stat-label">To'g'ri</div>
        </div>
        <div class="stat-box">
          <div class="stat-val" style="color: #f5222d;">${aiIncorrect}</div>
          <div class="stat-label">Noto'g'ri</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${Math.round((aiCorrect / battleQuestions.length) * 100)}%</div>
          <div class="stat-label">Foiz</div>
        </div>
      </div>
      <div class="battle-questions-list">
        ${aiQuestionsHtml}
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  const finishContainer = document.createElement('div');
  finishContainer.className = 'battle-finish-container';
  finishContainer.innerHTML = `
    <button onclick="backToDashboardFromBattle()" class="upwork-btn-primary" style="border: none; border-radius: 6px; padding: 12px 24px; font-weight: 600; cursor: pointer; color: #fff; background: #14a800;">Bosh sahifaga qaytish</button>
  `;
  container.appendChild(finishContainer);
}

window.backToDashboardFromBattle = function() {
  const existingSplit = document.querySelector('.battle-split-container');
  if (existingSplit) existingSplit.remove();
  
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.style.display = 'none';
  
  if (window.questionInterface) window.questionInterface.style.display = "none";
  if (window.lessonsSection) window.lessonsSection.style.display = "grid";
  if (window.backButton) window.backButton.style.display = "none";
  
  // Restore default displays
  if (window.setupInterfaceViews) window.setupInterfaceViews();
  
  isBattleActive = false;
  isBlitzActive = false;
};

// Open dynamic settings modal
window.openBattleSetup = function(isBlitz) {
  isBattleActive = !isBlitz;
  isBlitzActive = isBlitz;
  
  const modal = document.getElementById('battle-setup-modal');
  const modalTitle = document.getElementById('battle-modal-title');
  const apiGroup = document.getElementById('openrouter-api-key-group');
  const aiGroup = document.getElementById('ai-model-selection-group');
  const countSlider = document.getElementById('battle-question-count');
  const timeSlider = document.getElementById('battle-time-limit');
  const countVal = document.getElementById('battle-question-count-val');
  const timeVal = document.getElementById('battle-time-limit-val');
  
  // Set saved API Key with fallback to global config
  const savedKey = getOrchestrationApiKey();
  const apiInput = document.getElementById('openrouter-api-key');
  if (apiInput) apiInput.value = savedKey;

  if (isBlitz) {
    modalTitle.textContent = "Blitz Savollari Sozlamalari";
    if (apiGroup) apiGroup.style.display = 'none'; // Blitz is simulated/autocontrolled
    aiGroup.style.display = 'none';
    countSlider.value = 10;
    countVal.textContent = "10";
    timeSlider.value = 30; // 30 seconds for blitz
    timeVal.textContent = "30s";
  } else {
    modalTitle.textContent = "AI Arena Sozlamalari";
    if (apiGroup) apiGroup.style.display = 'flex';
    aiGroup.style.display = 'block';
    countSlider.value = 10;
    countVal.textContent = "10";
    timeSlider.value = 60;
    timeVal.textContent = "60s";
  }

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
};

// DOM listener to set up range value text updates and custom inputs
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('battle-setup-modal');
  const countSlider = document.getElementById('battle-question-count');
  const timeSlider = document.getElementById('battle-time-limit');
  const countVal = document.getElementById('battle-question-count-val');
  const timeVal = document.getElementById('battle-time-limit-val');
  const modelSelect = document.getElementById('battle-ai-model-select');
  const customModelGroup = document.getElementById('battle-custom-model-group');
  const startBtn = document.getElementById('start-battle-btn');
  const apiInput = document.getElementById('openrouter-api-key');
  
  if (countSlider && countVal) {
    countSlider.addEventListener('input', () => {
      countVal.textContent = countSlider.value;
    });
  }
  
  if (timeSlider && timeVal) {
    timeSlider.addEventListener('input', () => {
      timeVal.textContent = `${timeSlider.value}s`;
    });
  }
  
  if (modelSelect) {
    modelSelect.innerHTML = "";
    BACKUP_MODELS.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      
      const parts = model.split('/');
      const provider = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const name = parts[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      option.textContent = `${provider} ${name}`;
      modelSelect.appendChild(option);
    });
    
    // Add the custom option at the end
    const customOption = document.createElement('option');
    customOption.value = "custom";
    customOption.textContent = "Boshqa model (Qo'lda yozish)";
    modelSelect.appendChild(customOption);
  }
  
  if (modelSelect && customModelGroup) {
    modelSelect.addEventListener('change', () => {
      customModelGroup.style.display = modelSelect.value === 'custom' ? 'block' : 'none';
    });
  }
  
  // Close Modal triggers
  const closeBtn = modal?.querySelector('.modal-close');
  const backdrop = modal?.querySelector('.modal-backdrop');
  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  };
  
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  
  // Start Battle triggers
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const qCount = parseInt(countSlider.value);
      battleTimeLimit = parseInt(timeSlider.value);
      
      let apiKey = apiInput ? apiInput.value.trim() : "";
      if (!apiKey) apiKey = getOrchestrationApiKey(); // Fallback to global config key
      if (apiKey) {
        localStorage.setItem('avtotest_openrouter_key', apiKey);
      }
      
      let modelName = modelSelect.value === 'custom' 
        ? document.getElementById('battle-custom-model-input').value.trim()
        : modelSelect.value;
        
      if (!modelName) modelName = "google/gemini-2.5-flash";
      
      // Asynchronous State Guard for Questions pool
      if (!window.Questions || !Array.isArray(window.Questions) || window.Questions.length === 0) {
          console.warn("Questions state array is uninitialized. Re-fetching from active module storage...");
          window.Questions = window.Questions || JSON.parse(localStorage.getItem('questions_cache')) || [];
          if (window.Questions.length === 0) {
            if (window.showToast) window.showToast("Xatolik: Savollar yuklanmadi. Sahifani yangilang.");
            return;
          }
      }
      
      // Load questions
      const shuffled = [...window.Questions].sort(() => 0.5 - Math.random());
      battleQuestions = shuffled.slice(0, Math.min(qCount, shuffled.length));
      
      window.filteredQuestions = battleQuestions;
      window.currentQuestionIndex = 0;
      window.selectedAnswer = null;
      userSelectedChoices = [];
      isUserFinished = false;
      aiResults = null;
      
      // Close Config modal
      closeModal();
      
      // Bypasses normal sections
      if (window.lessonsSection) window.lessonsSection.style.display = 'none';
      if (window.chaptersSection) window.chaptersSection.style.display = 'none';
      if (window.topicsSection) window.topicsSection.style.display = 'none';
      
      if (window.questionInterface) {
        window.questionInterface.style.display = 'block';
      }
      if (window.backButton) window.backButton.style.display = 'inline-flex';
      
      // Hide standard share / review buttons
      const shareAllErrorsBtn = document.getElementById('share-all-errors-btn');
      if (shareAllErrorsBtn) shareAllErrorsBtn.style.display = 'none';
      
      const shareHelpBtn = document.getElementById('share-help-btn');
      if (shareHelpBtn) shareHelpBtn.style.display = 'none';
      
      if (window.setupInterfaceViews) window.setupInterfaceViews();
      
      // Start test session
      safeDisplayQuestion();
      window.generateTestNavigation();
      startBattleTimer(battleTimeLimit);
      
      // Kickoff AI request concurrently
      const ticker = document.getElementById('battle-status-ticker');
      if (ticker) {
        ticker.style.display = 'flex';
      }
      
      if (isBlitzActive || !apiKey) {
        if (!apiKey && isBattleActive) {
          if (window.showToast) window.showToast("API kalit kiritilmadi, AI Arena simulyatsiya rejimi yoqildi 🤖");
        }
        // Blitz or simulated AI Battle
        try {
          aiResults = await simulateAIAnswers(battleQuestions);
          if (isUserFinished) {
            renderSplitScreen();
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        // AI Arena with OpenRouter API
        if (window.showToast) window.showToast("AI test yechishni boshladi... 🤖⚡");
        try {
          aiResults = await fetchAIAnswersWithFallback(modelName, battleQuestions, apiKey);
          if (isUserFinished) {
            renderSplitScreen();
          }
        } catch (err) {
          console.error(err);
          if (window.showToast) window.showToast("AI Arena API xatolik berdi. Simulyatsiyaga o'tilmoqda...");
          aiResults = await simulateAIAnswers(battleQuestions);
          if (isUserFinished) {
            renderSplitScreen();
          }
        }
      }
    });
  }
});
