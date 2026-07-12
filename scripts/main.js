// Import modules
import { LanguageSwitcher } from './utils/LanguageSwitcher.js';
import { chapters, topic } from '../data/data.js';
import { Questions } from '../data/questions.js';
import { Answers } from '../data/answers.js';
import { NewTestManager } from './components/newTest.js';
import { ImageModal } from './components/imgModal.js';

let appInitialized = false;
const languageSwitcher = new LanguageSwitcher();
let newTestManager = null;
const imageModal = new ImageModal();

// DOM elements
const lessonsSection = document.querySelector('.lessons');
const chaptersSection = document.querySelector('.chapters');
const topicsSection = document.querySelector('.topics');
const backButton = document.querySelector('#back-button');
const questionInterface = document.querySelector('#question-interface');
const questionContainer = document.querySelector('#question');
const answersContainer = document.querySelector('#answers');
const questionImageContainer = document.querySelector('#question-image');
const testNavigation = document.querySelector('#test-navigation');
const prevButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
const resultElement = document.querySelector('#result');
const percentageDisplay = document.querySelector('#percentageDisplay');

let currentQuestionIndex = 0;
let selectedAnswer = null;
let filteredQuestions = [];
let selectedTopicId = null;
let selectedChapterId = null;
let correctAnswers = [];
let userAnswers = [];
let isTestMode = false;
let totalQuestionsAnswered = 0;
let totalMistakes = 0;
let isOraliqTest = false;
let isImtihonTest = false;
let testTimer = null;
let timeRemaining = 0;
let isDarslarLessonMode = true; 
let isDarslarModeActive = false; 

if (backButton) {
  backButton.style.display = 'none';
}

function addBackArrow() {
  if (!backButton) return;
  if (!backButton.querySelector('.back-arrow')) {
    const backArrow = document.createElement("img");
    backArrow.src = "./assets/arrowLeft.svg";
    backArrow.alt = "arrow";
    backArrow.className = "back-arrow";
    backButton.insertBefore(backArrow, backButton.firstChild);
  }
  if (!backButton.querySelector('.back-text')) {
    const backText = document.createElement("span");
    backText.className = "back-text";
    backButton.appendChild(backText);
  }
}

function updateBackButtonText(text) {
  if (!backButton) return;
  const backTextSpan = backButton.querySelector('.back-text');
  if (backTextSpan) {
    backTextSpan.textContent = text;
  }
}

addBackArrow();

function addNavigationArrows() {
  if (!prevButton || !nextButton) return;
  if (!prevButton.querySelector('.nav-arrow')) {
    const prevArrow = document.createElement("img");
    prevArrow.src = "./assets/arrowLeft.svg";
    prevArrow.alt = "previous";
    prevArrow.className = "nav-arrow";
    prevButton.insertBefore(prevArrow, prevButton.firstChild);
  }
  if (!nextButton.querySelector('.nav-arrow')) {
    const nextArrow = document.createElement("img");
    nextArrow.src = "./assets/arrowRight.svg";
    nextArrow.alt = "next";
    nextArrow.className = "nav-arrow";
    nextButton.insertBefore(nextArrow, nextButton.firstChild);
  }
}

addNavigationArrows();

function displayChapters() {
  if (!chaptersSection || !backButton) return;
  chaptersSection.innerHTML = "";
  chaptersSection.style.display = "flex";
  backButton.style.display = 'inline-flex';
  updateBackButtonText(languageSwitcher.getTranslation('back'));
  addBackArrow();
  chapters.forEach((chapter) => {
    const button = document.createElement("button");
    button.className = "chapter-button";
    const arrowSvg = document.createElement("img");
    arrowSvg.src = "./assets/arrow.svg";
    arrowSvg.alt = "arrow";
    arrowSvg.className = "chapter-arrow";
    const textSpan = document.createElement("span");
    textSpan.innerText = languageSwitcher.getChapterName(chapter);
    button.appendChild(textSpan);
    button.appendChild(arrowSvg);
    button.addEventListener("click", () => selectChapter(chapter));
    chaptersSection.appendChild(button);
  });
}

function displayTopicsByChapter(chapterId) {
  if (!topicsSection || !backButton || !chaptersSection) return;
  topicsSection.innerHTML = "";
  topicsSection.style.display = "grid";
  backButton.style.display = 'inline-flex';
  updateBackButtonText(languageSwitcher.getTranslation('back'));
  addBackArrow();
  chaptersSection.style.display = "none";
  const hiddenTopicIds = [20, 22, 23, 26, 27, 28, 29, 30, 31, 35, 36, 41, 44];
  let filteredTopics;
  if (chapterId === 999) {
    filteredTopics = topic.filter(topicItem => hiddenTopicIds.includes(topicItem.id));
  } else {
    filteredTopics = topic.filter(filteredTopic => filteredTopic.oraliq === chapterId);
  }
  if (filteredTopics.length === 0) {
    topicsSection.innerHTML = `<div class="no-topics"><h3>No topics available</h3></div>`;
    return;
  }
  let displayNumber = 1;
  filteredTopics.forEach((topicItem) => {
    const topicDiv = document.createElement("div");
    topicDiv.className = "topic-item";
    const topicTitle = document.createElement("h3");
    const topicName = languageSwitcher.getTopicName(topicItem);
    const nameWithoutNumber = topicName.replace(/^\d+\./, '').trim();
    topicTitle.innerText = `${displayNumber}.${nameWithoutNumber}`;
    topicDiv.appendChild(topicTitle);
    topicDiv.addEventListener("click", () => selectTopic(topicItem));
    topicsSection.appendChild(topicDiv);
    displayNumber++;
  });
}

function selectTopic(topicItem) {
  selectedTopicId = topicItem.id;
  isDarslarModeActive = true;
  isOraliqTest = false;
  isImtihonTest = false;
  if (topicsSection) topicsSection.style.display = "none";
  if (questionInterface) questionInterface.style.display = "block";
  if (backButton) {
    backButton.style.display = 'inline-flex';
    updateBackButtonText(languageSwitcher.getTranslation('back'));
    addBackArrow();
  }
  
  setupInterfaceViews();
  addDarslarModeToggle();
  filterQuestionsByTopic(topicItem.id);
}

function addDarslarModeToggle() {
  const existingToggle = document.querySelector('.darslar-mode-toggle');
  if (existingToggle) existingToggle.remove();
  
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'darslar-mode-toggle';
  
  const darslikTab = document.createElement('button');
  darslikTab.type = 'button';
  darslikTab.className = `mode-tab darslik-tab ${isDarslarLessonMode ? 'active' : ''}`;
  darslikTab.innerText = 'Darslik';
  
  const testTab = document.createElement('button');
  testTab.type = 'button';
  testTab.className = `mode-tab test-tab ${!isDarslarLessonMode ? 'active' : ''}`;
  testTab.innerText = 'Test';
  
  darslikTab.addEventListener('click', () => {
    if (!isDarslarLessonMode) {
      isDarslarLessonMode = true;
      darslikTab.classList.add('active');
      testTab.classList.remove('active');
      selectedAnswer = null;
      if (resultElement) resultElement.innerText = "";
      displayQuestion();
    }
  });
  
  testTab.addEventListener('click', () => {
    if (isDarslarLessonMode) {
      isDarslarLessonMode = false;
      testTab.classList.add('active');
      darslikTab.classList.remove('active');
      selectedAnswer = null;
      if (resultElement) resultElement.innerText = "";
      displayQuestion();
    }
  });
  
  toggleContainer.appendChild(darslikTab);
  toggleContainer.appendChild(testTab);
  document.body.appendChild(toggleContainer);
}

function removeDarslarModeToggle() {
  const existingToggle = document.querySelector('.darslar-mode-toggle');
  if (existingToggle) existingToggle.remove();
}

function deactivateDarslarMode() {
  isDarslarModeActive = false;
  removeDarslarModeToggle();
  const shareAllErrorsBtn = document.getElementById('share-all-errors-btn');
  if (shareAllErrorsBtn) shareAllErrorsBtn.style.display = 'none';
}

function filterQuestionsByTopic(topicId) {
  filteredQuestions = Questions.filter((question) => question.oraliq_dars === topicId);
  currentQuestionIndex = 0;
  selectedAnswer = null;
  correctAnswers = new Array(filteredQuestions.length).fill(undefined);
  userAnswers = [];
  totalQuestionsAnswered = 0;
  totalMistakes = 0;
  displayQuestion();
  generateTestNavigation();
}

function displayQuestion() {
  if (!questionContainer || !answersContainer || !questionImageContainer) return;
  if (filteredQuestions.length === 0) {
    questionContainer.innerText = "No questions available.";
    answersContainer.innerHTML = "";
    return;
  }
  const question = filteredQuestions[currentQuestionIndex];
  // Rasmlarni lokal papkadan emas, to'g'ridan-to'g'ri onlayn Vercel saytidan oladi
  const questionImage = question.image ? `https://ferdavs-avtotest.vercel.app/${question.image}` : "./logo.png";
  const relatedTopic = topic.find((t) => t.id === question.oraliq_dars);
  const relatedChapter = relatedTopic ? chapters.find((c) => c.id === relatedTopic.oraliq) : null;
  const questionText = languageSwitcher.getQuestionText(question);
  const topicNumber = relatedTopic ? relatedTopic.name_uz.split(".")[0] : "";
  const chapterId = relatedChapter && relatedChapter.id === 4 ? 3 : relatedChapter ? relatedChapter.id : "";
  
  questionContainer.innerHTML = `<div>${chapterId}.${topicNumber} ${questionText}</div>`;
  questionImageContainer.innerHTML = `<img src="${questionImage}" alt="Image" style="cursor: pointer;">`;
  
  const imgElement = questionImageContainer.querySelector('img');
  if (imgElement) {
    imgElement.addEventListener('click', () => imageModal.open(questionImage));
  }
  
  answersContainer.innerHTML = "";
  const filteredAnswers = Answers.filter((answer) => answer.oraliq_dars_question === question.id);
  const optionLabels = ["F1", "F2", "F3", "F4", "F5"];
  
  filteredAnswers.forEach((answer, index) => {
    const answerElement = document.createElement("div");
    answerElement.className = "answer";
    const optionSpan = document.createElement("span");
    optionSpan.className = "option-label";
    optionSpan.innerText = optionLabels[index] || "";
    const textSpan = document.createElement("span");
    textSpan.innerText = languageSwitcher.getAnswerText(answer);
    answerElement.appendChild(optionSpan);
    answerElement.appendChild(textSpan);
    
    const userAnswer = userAnswers[currentQuestionIndex];
    if (userAnswer) {
      if (userAnswer.answerId === answer.id) {
        answerElement.classList.add(userAnswer.isCorrect ? "correct-answer" : "incorrect-answer");
      }
      if (answer.is_true) answerElement.classList.add("correct-answer");
    } else if (isDarslarModeActive && isDarslarLessonMode && !isOraliqTest && !isImtihonTest && answer.is_true) {
      answerElement.classList.add("lesson-mode-correct");
    }
    
    answerElement.addEventListener("click", () => {
      if (!selectedAnswer) {
        // In Lesson Mode, clicking incorrect (white) options is ignored
        if (isDarslarModeActive && isDarslarLessonMode && !isOraliqTest && !isImtihonTest && !answer.is_true) {
          return;
        }
        selectedAnswer = answer;
        document.querySelectorAll(".answer").forEach((a) => {
          a.classList.remove("selected", "lesson-mode-correct");
        });
        answerElement.classList.add("selected");
        checkAnswer(answerElement);
      }
    });
    answersContainer.appendChild(answerElement);
  });
  
  if (prevButton) prevButton.disabled = currentQuestionIndex === 0;
  if (nextButton) nextButton.disabled = currentQuestionIndex === filteredQuestions.length - 1;
  updateTestNavigation();
}

function checkAnswer(answerElement) {
  if (selectedAnswer) {
    totalQuestionsAnswered++;
    userAnswers[currentQuestionIndex] = {
      answerId: selectedAnswer.id,
      isCorrect: selectedAnswer.is_true,
    };
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (selectedAnswer.is_true) {
      answerElement.classList.add("correct-answer");
      correctAnswers[currentQuestionIndex] = true;
      if (resultElement) resultElement.innerText = "To'g'ri!";
      if (currentQuestion) {
        removeQuestionFromErrors(currentQuestion.id);
      }
    } else {
      answerElement.classList.add("incorrect-answer");
      correctAnswers[currentQuestionIndex] = false;
      totalMistakes++;
      if (resultElement) resultElement.innerText = "Noto'g'ri!";
      if (currentQuestion) {
        addQuestionToErrors(currentQuestion.id);
      }
      const allAnswerElements = answersContainer.getElementsByClassName("answer");
      const filteredAnswers = Answers.filter(ans => ans.oraliq_dars_question === filteredQuestions[currentQuestionIndex].id);
      filteredAnswers.forEach((ans, index) => {
        if (ans.is_true && allAnswerElements[index]) allAnswerElements[index].classList.add("correct-answer");
      });
      
      if (isImtihonTest && totalMistakes >= 3) {
        setTimeout(() => {
          window.location.reload(); 
        }, 1500);
        return;
      }
    }
    
    updatePercentageDisplay();
    updateTestNavigation();
    setTimeout(() => nextQuestion(), 1500);
  }
}

function updatePercentageDisplay() {
  if (!percentageDisplay) return;
  const percentage = 100 - (totalMistakes / totalQuestionsAnswered) * 100;
  percentageDisplay.innerText = `Tog'ri Javoblar: ${percentage.toFixed(2)}%`;
  percentageDisplay.classList.remove("hidden");
}

function generateTestNavigation() {
  if (!testNavigation) return;
  testNavigation.innerHTML = "";
  filteredQuestions.forEach((_, index) => {
    const navBox = document.createElement("div");
    navBox.textContent = index + 1;
    navBox.classList.add("nav-box");
    if (correctAnswers[index] !== undefined) {
      navBox.classList.add(correctAnswers[index] ? "correct" : "incorrect");
    }
    navBox.addEventListener("click", () => {
      currentQuestionIndex = index;
      selectedAnswer = null;
      displayQuestion();
    });
    testNavigation.appendChild(navBox);
  });
}

function updateTestNavigation() {
  const navBoxes = document.querySelectorAll(".nav-box");
  navBoxes.forEach((box, index) => {
    box.classList.remove("active", "correct", "incorrect");
    if (correctAnswers[index] === true) box.classList.add("correct");
    else if (correctAnswers[index] === false) box.classList.add("incorrect");
    if (index === currentQuestionIndex) box.classList.add("active");
  });
}

function nextQuestion() {
  if (newTestManager) { newTestManager.nextQuestion(); return; }
  if (currentQuestionIndex < filteredQuestions.length - 1) {
    currentQuestionIndex++; selectedAnswer = null; if (resultElement) resultElement.innerText = ""; displayQuestion();
  }
}

function prevQuestion() {
  if (newTestManager) { newTestManager.prevQuestion(); return; }
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--; selectedAnswer = null; if (resultElement) resultElement.innerText = ""; displayQuestion();
  }
}

function goBack() {
  if (!questionInterface || !chaptersSection || !topicsSection || !lessonsSection || !backButton) return;
  if (questionInterface.style.display === "block") {
    questionInterface.style.display = "none";
    const existingContainer = questionInterface.querySelector('.test-options-container');
    if (existingContainer) existingContainer.remove();
    deactivateDarslarMode();
    newTestManager = null;
    currentQuestionIndex = 0; selectedAnswer = null; filteredQuestions = []; correctAnswers = []; userAnswers = [];
    totalQuestionsAnswered = 0; totalMistakes = 0; if (resultElement) resultElement.innerText = ""; if (percentageDisplay) percentageDisplay.classList.add("hidden");
    if (testTimer) { clearInterval(testTimer); testTimer = null; }
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.style.display = 'none';
    if (isOraliqTest) {
      chaptersSection.style.display = "flex";
    } else if (selectedTopicId !== null) { 
      topicsSection.style.display = "grid"; selectedTopicId = null; 
    } else { 
      lessonsSection.style.display = "grid"; backButton.style.display = 'none'; 
    }
  } else if (topicsSection.style.display === "grid") {
    topicsSection.style.display = "none"; chaptersSection.style.display = "flex";
  } else if (chaptersSection.style.display === "flex") {
    chaptersSection.style.display = "none"; lessonsSection.style.display = "grid"; backButton.style.display = 'none';
    isOraliqTest = false; isImtihonTest = false; selectedChapterId = null;
  }
}

function selectChapter(chapter) {
  selectedChapterId = chapter.id;
  if (chapter.id === 5) { startNewTest(); return; }
  if (isOraliqTest) showOraliqTestOptions(chapter);
  else displayTopicsByChapter(chapter.id);
}

function startNewTest() {
  deactivateDarslarMode(); selectedTopicId = null;
  if (chaptersSection) chaptersSection.style.display = "none"; 
  if (questionInterface) questionInterface.style.display = "block";
  if (backButton) {
    backButton.style.display = 'inline-flex'; 
    updateBackButtonText(languageSwitcher.getTranslation('back'));
  }
  isOraliqTest = true; isImtihonTest = false;
  setupInterfaceViews();
  newTestManager = new NewTestManager(languageSwitcher, imageModal);
  newTestManager.init();
}

function setupInterfaceViews() {
  if (!questionInterface) return;
  const elements = ['.question-content', '#test-navigation', '.question-controls', '#result', '#percentageDisplay'];
  elements.forEach(sel => { 
    const el = questionInterface.querySelector(sel); 
    if (el) {
      if (sel === '.question-content') {
        el.style.display = 'grid';
      } else {
        el.style.display = 'flex';
      }
    } 
  });
}

function showOraliqTestOptions(chapter) {
  deactivateDarslarMode(); selectedTopicId = null;
  if (chaptersSection) chaptersSection.style.display = "none"; 
  if (questionInterface) questionInterface.style.display = "block";
  if (backButton) backButton.style.display = 'inline-flex';
  const existingContainer = questionInterface.querySelector('.test-options-container');
  if (existingContainer) existingContainer.remove();
  
  const testOptionsContainer = document.createElement('div');
  testOptionsContainer.className = 'test-options-container';
  testOptionsContainer.innerHTML = `
     <div class="test-options">
       <h2>${languageSwitcher.getChapterName(chapter)}</h2>
       <div class="test-buttons">
         <button class="test-option-btn" data-questions="20" data-timer="true"><span>20 ta Savol</span><small>25 daqiqa</small></button>
         <button class="test-option-btn" data-questions="50" data-timer="false"><span>50 ta Savol</span><small>Cheklovsiz</small></button>
       </div>
     </div>`;
  questionInterface.appendChild(testOptionsContainer);
  testOptionsContainer.querySelectorAll('.test-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startOraliqTest(parseInt(btn.dataset.questions), btn.dataset.timer === 'true');
      testOptionsContainer.remove();
    });
  });
}

function startOraliqTest(num, withTimer) {
  isOraliqTest = true; isImtihonTest = false; deactivateDarslarMode(); selectedTopicId = null;
  setupInterfaceViews();
  const hiddenTopicIds = [20, 22, 23, 26, 27, 28, 29, 30, 31, 35, 36, 41, 44];
  let questionsInChapter = selectedChapterId === 999 
    ? Questions.filter(q => hiddenTopicIds.includes(q.oraliq_dars))
    : Questions.filter(q => { const t = topic.find(x => x.id === q.oraliq_dars); return t && t.oraliq === selectedChapterId; });
    
  filteredQuestions = questionsInChapter.sort(() => 0.5 - Math.random()).slice(0, num);
  currentQuestionIndex = 0; selectedAnswer = null; correctAnswers = new Array(filteredQuestions.length).fill(undefined);
  userAnswers = []; totalQuestionsAnswered = 0; totalMistakes = 0;
  if (withTimer) { timeRemaining = 25 * 60; startTimer(); }
  displayQuestion(); generateTestNavigation();
}

function startTimer() {
  const timerElement = document.getElementById('timer');
  if (!timerElement) return;
  timerElement.style.display = 'block';
  testTimer = setInterval(() => {
    const mins = Math.floor(timeRemaining / 60); const secs = timeRemaining % 60;
    timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (timeRemaining <= 0) { clearInterval(testTimer); window.location.reload(); }
    timeRemaining--;
  }, 1000);
}

function showTestlarOptions() {
  deactivateDarslarMode(); selectedTopicId = null;
  if (questionInterface) questionInterface.style.display = "block"; 
  if (backButton) backButton.style.display = 'inline-flex';
  const testOptionsContainer = document.createElement('div');
  testOptionsContainer.className = 'test-options-container';
  testOptionsContainer.innerHTML = `
     <div class="test-options">
       <h2>Umumiy Testlar</h2>
       <div class="test-buttons">
         <button class="test-option-btn" data-questions="20" data-timer="true"><span>20 ta Savol</span><small>25 daqiqa</small></button>
         <button class="test-option-btn" data-questions="50" data-timer="false"><span>50 ta Savol</span><small>Cheklovsiz</small></button>
       </div>
     </div>`;
  if (questionInterface) questionInterface.appendChild(testOptionsContainer);
  testOptionsContainer.querySelectorAll('.test-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      isOraliqTest = false; isImtihonTest = false; setupInterfaceViews();
      filteredQuestions = Questions.sort(() => 0.5 - Math.random()).slice(0, parseInt(btn.dataset.questions));
      currentQuestionIndex = 0; selectedAnswer = null; correctAnswers = new Array(filteredQuestions.length).fill(undefined);
      if (btn.dataset.timer === 'true') { timeRemaining = 25 * 60; startTimer(); }
      displayQuestion(); generateTestNavigation(); testOptionsContainer.remove();
    });
  });
}

function showImtihonOptions() {
  deactivateDarslarMode(); selectedTopicId = null; 
  if (questionInterface) questionInterface.style.display = "block"; 
  if (backButton) backButton.style.display = 'inline-flex';
  const testOptionsContainer = document.createElement('div');
  testOptionsContainer.className = 'test-options-container';
  testOptionsContainer.innerHTML = `
     <div class="test-options">
       <h2>Nazariy Imtihon</h2>
       <p style="color: #fff; margin-bottom: 30px;">20 ta savol, 25 daqiqa. 3 ta xato bilan imtihon tugaydi.</p>
       <button class="test-option-btn imtihon-start">Imtihonni boshlash</button>
     </div>`;
  if (questionInterface) questionInterface.appendChild(testOptionsContainer);
  testOptionsContainer.querySelector('.imtihon-start').addEventListener('click', () => {
    isOraliqTest = false; isImtihonTest = true; setupInterfaceViews();
    filteredQuestions = Questions.sort(() => 0.5 - Math.random()).slice(0, 20);
    currentQuestionIndex = 0; selectedAnswer = null; correctAnswers = new Array(filteredQuestions.length).fill(undefined);
    timeRemaining = 25 * 60; startTimer(); displayQuestion(); generateTestNavigation(); testOptionsContainer.remove();
  });
}

// Sleek Toast Notification Helper
function showToast(message) {
  let toast = document.querySelector('.upwork-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'upwork-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Load Shared Question View
function loadSharedQuestion(questionId) {
  const qId = parseInt(questionId);
  const question = Questions.find(q => q.id === qId);
  if (question) {
    filteredQuestions = [question];
    currentQuestionIndex = 0;
    
    // Hide login screen and all main panels
    document.getElementById('login-screen')?.classList.add('hidden');
    if (lessonsSection) lessonsSection.style.display = 'none';
    if (chaptersSection) chaptersSection.style.display = 'none';
    if (topicsSection) topicsSection.style.display = 'none';
    if (backButton) backButton.style.display = 'none';
    
    // Show question interface
    if (questionInterface) {
      questionInterface.style.display = 'block';
    }
    
    // Hide navigation/statistics controls for shared single view
    if (testNavigation) testNavigation.style.display = 'none';
    if (prevButton) prevButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'none';
    if (percentageDisplay) percentageDisplay.style.display = 'none';
    
    // Hide the get help button inside shared single view
    const shareHelpBtn = document.getElementById('share-help-btn');
    if (shareHelpBtn) shareHelpBtn.style.display = 'none';
    
    displayQuestion();
  }
}

// LocalStorage Mistakes Tracking Helpers
function addQuestionToErrors(questionId) {
  let errors = JSON.parse(localStorage.getItem('avtotest_errors')) || [];
  if (!errors.includes(questionId)) {
    errors.push(questionId);
    localStorage.setItem('avtotest_errors', JSON.stringify(errors));
  }
}

function removeQuestionFromErrors(questionId) {
  let errors = JSON.parse(localStorage.getItem('avtotest_errors')) || [];
  const index = errors.indexOf(questionId);
  if (index > -1) {
    errors.splice(index, 1);
    localStorage.setItem('avtotest_errors', JSON.stringify(errors));
  }
}

// Start Mistakes Review Session
function startMistakesReviewSession(errorIds) {
  deactivateDarslarMode();
  
  // Hide dashboards, login screens
  document.getElementById('login-screen')?.classList.add('hidden');
  if (lessonsSection) lessonsSection.style.display = 'none';
  if (chaptersSection) chaptersSection.style.display = 'none';
  if (topicsSection) topicsSection.style.display = 'none';
  
  // Show question interface and back button
  if (questionInterface) questionInterface.style.display = 'block';
  if (backButton) backButton.style.display = 'inline-flex';
  
  setupInterfaceViews();
  
  filteredQuestions = Questions.filter(q => errorIds.includes(q.id));
  
  if (filteredQuestions.length === 0) {
    // Hide other child elements
    const elements = ['.question-content', '#test-navigation', '.question-controls', '#result', '#percentageDisplay'];
    elements.forEach(sel => { 
      const el = questionInterface.querySelector(sel); 
      if (el) el.style.display = 'none';
    });
    
    // Remove existing empty state if any
    const existingEmpty = questionInterface.querySelector('.empty-error-state');
    if (existingEmpty) existingEmpty.remove();
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-error-state';
    emptyState.innerHTML = `
      <h3>Hamma xatolar tuzatildi! 🎉</h3>
      <p>Sizda hozircha yechilmagan xatoli savollar mavjud emas.</p>
      <button onclick="backToDashboard()" class="upwork-btn-primary">Bosh sahifaga qaytish</button>
    `;
    questionInterface.appendChild(emptyState);
    return;
  } else {
    // Remove empty state if present
    const existingEmpty = questionInterface.querySelector('.empty-error-state');
    if (existingEmpty) existingEmpty.remove();
  }
  
  currentQuestionIndex = 0;
  selectedAnswer = null;
  correctAnswers = new Array(filteredQuestions.length).fill(undefined);
  userAnswers = [];
  totalQuestionsAnswered = 0;
  totalMistakes = 0;
  
  displayQuestion();
  generateTestNavigation();
  
  // Show bulk errors share button and hide single share button
  const shareAllErrorsBtn = document.getElementById('share-all-errors-btn');
  if (shareAllErrorsBtn) shareAllErrorsBtn.style.display = 'flex';
  
  const shareHelpBtn = document.getElementById('share-help-btn');
  if (shareHelpBtn) shareHelpBtn.style.display = 'none';
}

window.backToDashboard = function() {
  const emptyState = document.querySelector('.empty-error-state');
  if (emptyState) emptyState.remove();
  
  if (questionInterface) {
    questionInterface.style.display = "none";
    setupInterfaceViews();
  }
  if (lessonsSection) lessonsSection.style.display = "grid";
  if (backButton) backButton.style.display = "none";
  deactivateDarslarMode();
  
  const shareAllErrorsBtn = document.getElementById('share-all-errors-btn');
  if (shareAllErrorsBtn) shareAllErrorsBtn.style.display = 'none';
};

// Initialize Shared Error Session (Ingestion)
function initializeSharedErrorSession(errorIds) {
  document.getElementById('login-screen')?.classList.add('hidden');
  if (lessonsSection) lessonsSection.style.display = 'none';
  if (chaptersSection) chaptersSection.style.display = 'none';
  if (topicsSection) topicsSection.style.display = 'none';
  if (backButton) backButton.style.display = 'none';
  
  if (questionInterface) {
    questionInterface.style.display = 'block';
  }
  
  filteredQuestions = Questions.filter(q => errorIds.includes(q.id));
  currentQuestionIndex = 0;
  selectedAnswer = null;
  correctAnswers = new Array(filteredQuestions.length).fill(undefined);
  userAnswers = [];
  
  displayQuestion();
  generateTestNavigation();
  
  // Hide both share buttons inside shared view
  const shareAllErrorsBtn = document.getElementById('share-all-errors-btn');
  if (shareAllErrorsBtn) shareAllErrorsBtn.style.display = 'none';
  
  const shareHelpBtn = document.getElementById('share-help-btn');
  if (shareHelpBtn) shareHelpBtn.style.display = 'none';
}

// App DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  const adminLinks = document.querySelectorAll('[data-admin-visible]');
  adminLinks.forEach(el => el.classList.remove('hidden'));
  
  const desktopUserName = document.getElementById('desktop-user-name');
  if (desktopUserName) desktopUserName.textContent = 'Haydovchi';
  
  const darslarBtn = document.querySelector('.darslar');
  if (darslarBtn) {
    darslarBtn.addEventListener("click", () => { isOraliqTest = false; if (lessonsSection) lessonsSection.style.display = "none"; displayChapters(); });
  }
  
  const oraliqBtn = document.querySelector('.oraliq');
  if (oraliqBtn) {
    oraliqBtn.addEventListener("click", () => { isOraliqTest = true; if (lessonsSection) lessonsSection.style.display = "none"; displayChapters(); });
  }
  
  const testlarBtn = document.querySelector('.testlar');
  if (testlarBtn) {
    testlarBtn.addEventListener("click", () => { if (lessonsSection) lessonsSection.style.display = "none"; showTestlarOptions(); });
  }
  
  const imtihonBtn = document.querySelector('.imtihon');
  if (imtihonBtn) {
    imtihonBtn.addEventListener("click", () => { if (lessonsSection) lessonsSection.style.display = "none"; showImtihonOptions(); });
  }
  
  if (backButton) backButton.addEventListener('click', goBack);
  if (prevButton) prevButton.addEventListener('click', prevQuestion);
  if (nextButton) nextButton.addEventListener('click', nextQuestion);
  
  const avatarToggle = document.getElementById('user-avatar-toggle');
  const avatarMenu = document.getElementById('user-avatar-menu');
  if (avatarToggle && avatarMenu) {
    avatarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = avatarToggle.getAttribute('aria-expanded') === 'true';
      avatarToggle.setAttribute('aria-expanded', !open);
      avatarMenu.setAttribute('aria-hidden', open);
    });
  }
  
  document.getElementById('desktop-logout-button')?.addEventListener('click', () => window.location.reload());
  document.getElementById('mobile-logout-button')?.addEventListener('click', () => window.location.reload());
  
  // Yordam olish (Get Help) Click Handler
  const shareHelpBtn = document.getElementById('share-help-btn');
  const helpModal = document.getElementById('help-modal');
  const shareLinkInput = document.getElementById('share-link-input');
  const modalCopyBtn = document.getElementById('modal-copy-btn');
  
  if (shareHelpBtn && helpModal && shareLinkInput) {
    shareHelpBtn.addEventListener('click', () => {
      const currentQuestion = filteredQuestions[currentQuestionIndex];
      if (currentQuestion) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('questionId', currentQuestion.id);
        shareLinkInput.value = currentUrl.href;
        
        // Open Modal
        helpModal.style.display = 'flex';
        setTimeout(() => helpModal.classList.add('show'), 10);
      }
    });
  }
  
  // Close Modal Helpers
  if (helpModal) {
    const closeBtn = helpModal.querySelector('.modal-close-btn');
    const backdrop = helpModal.querySelector('.modal-backdrop');
    
    const closeModal = () => {
      helpModal.classList.remove('show');
      setTimeout(() => {
        helpModal.style.display = 'none';
      }, 300);
    };
    
    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
  }
  
  // Modal Copy Action
  if (modalCopyBtn && shareLinkInput) {
    modalCopyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(shareLinkInput.value).then(() => {
        modalCopyBtn.innerText = "Nusxalandi! ✓";
        modalCopyBtn.style.background = "#118f00";
        showToast("Havola nusxalandi!");
        
        setTimeout(() => {
          modalCopyBtn.innerText = "Nusxalash";
          modalCopyBtn.style.background = "#14a800";
        }, 2000);
      });
    });
  }
  
  // Mistakes Review Button Click Handler
  const xatolarBtn = document.querySelector('.xatolar-ustida-ishlash');
  if (xatolarBtn) {
    xatolarBtn.addEventListener("click", () => {
      const errors = JSON.parse(localStorage.getItem('avtotest_errors')) || [];
      if (errors.length === 0) {
        showToast("Sizda yechish uchun xatolar mavjud emas!");
        return;
      }
      if (lessonsSection) lessonsSection.style.display = "none";
      startMistakesReviewSession(errors);
    });
  }
  
  // Share All Errors Click Handler
  const shareAllErrorsBtn = document.getElementById('share-all-errors-btn');
  if (shareAllErrorsBtn && helpModal && shareLinkInput) {
    shareAllErrorsBtn.addEventListener('click', () => {
      const errors = JSON.parse(localStorage.getItem('avtotest_errors')) || [];
      if (errors.length === 0) {
        showToast("Sizda ulashish uchun xatolar mavjud emas!");
        return;
      }
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('errorIds', errors.join(','));
      shareLinkInput.value = currentUrl.href;
      
      const modalInstructionText = helpModal.querySelector('.modal-instruction-text');
      if (modalInstructionText) {
        modalInstructionText.textContent = "Ushbu havolani olib, sizga barcha xatolaringizni yechishda yordam bera oladigan odamga yuboring😉😊";
      }
      
      helpModal.style.display = 'flex';
      setTimeout(() => helpModal.classList.add('show'), 10);
    });
  }
  
  // URL Checker for Shared Question & Shared Errors
  const urlParams = new URLSearchParams(window.location.search);
  const sharedQuestionId = urlParams.get('questionId');
  const sharedErrorString = urlParams.get('errorIds');
  
  if (sharedQuestionId) {
    loadSharedQuestion(sharedQuestionId);
  } else if (sharedErrorString) {
    const sharedErrorIds = sharedErrorString.split(',').map(Number);
    initializeSharedErrorSession(sharedErrorIds);
  }
});