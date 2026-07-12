// Simple Language Switcher Module
export class LanguageSwitcher {
  constructor() {
    this.currentLanguage = 'uz'; // uz, ru, cry
    this.translations = {
      uz: {
        lessons: 'Darslar',
        midterm: 'Oraliq Test', 
        tests: 'Testlar',
        variants: 'Variantlar',
        imtihon: 'Nazariy imtihon',
        back: 'Orqaga',
        chapters: ['1 - Bo\'lim', '2 - Bo\'lim', '3 - Bo\'lim']
      },
      ru: {
        lessons: 'Уроки',
        midterm: 'промежут тест',
        tests: 'Тесты', 
        variants: 'Варианты',
        imtihon: 'Теоретический экзамен',
        back: 'Назад',
        chapters: ['Глава 1', 'Глава 2', 'Глава 3']
      },
      cry: {
        lessons: 'Дарслар',
        midterm: 'Оралик Тест',
        tests: 'Тестлар',
        variants: 'Вариантлар', 
        imtihon: 'Назарий имтихон',
        back: 'Орқага',
        chapters: ['Болим 1', 'Болим 2', 'Болим - 3']
      }
    };
    
    this.initialize();
  }

  initialize() {
    // Note: Desktop language buttons have been replaced with dropdown
    // Mobile language buttons are handled in initializeMobileMenu()
    // This method now only updates UI elements that exist
    
    // Update UI with default language
    this.updateUI();
  }

  setLanguage(language) {
    this.currentLanguage = language;
    this.updateUI();
    
    // Trigger custom event for other parts of the app
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: this.currentLanguage } 
    }));
  }

  updateUI() {
    const t = this.translations[this.currentLanguage];
    
    // Note: Desktop language buttons have been replaced with dropdown
    // Language selection is handled by the dropdown component
    
    // Update main navigation buttons
    const oraliq = document.querySelector(".oraliq");
    const darslar = document.querySelector(".darslar");
    const testlar = document.querySelector(".testlar");
    const variant = document.querySelector(".variant");
    const imtihon = document.querySelector(".imtihon");
    
    if (oraliq) oraliq.innerHTML = `<img src="./assets/timer.png" alt=""><span>${t.midterm}</span>`;
    if (darslar) darslar.innerHTML = `<img src="./assets/book.png" alt=""><span>${t.lessons}</span>`;
    if (testlar) testlar.innerHTML = `<img src="./assets/test.png" alt=""><span>${t.tests}</span>`;
    if (variant) variant.innerHTML = `<span>${t.variants}</span>`;
    if (imtihon) imtihon.innerHTML = `<img src="./assets/graduate.png" alt=""><span>${t.imtihon}</span>`;

    // Update chapter buttons if they exist
    setTimeout(() => {
      const chapterButtons = document.querySelectorAll(".Oraliq-chapter-button");
      if (chapterButtons.length > 0) {
        chapterButtons.forEach((button, index) => {
          if (t.chapters[index]) {
            button.innerHTML = t.chapters[index];
          }
        });
      }
    }, 100);
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getTranslation(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  // Helper methods for getting text in current language
  getQuestionText(question) {
    if (!question) return '';
    const key = `question_${this.currentLanguage}`;
    return question[key] || question.question_uz || '';
  }

  getAnswerText(answer) {
    if (!answer) return '';
    const key = `answer_${this.currentLanguage}`;
    return answer[key] || answer.answer_uz || '';
  }

  getChapterName(chapter) {
    if (!chapter) return '';
    const key = `name_${this.currentLanguage}`;
    return chapter[key] || chapter.name_uz || '';
  }

  getTopicName(topic) {
    if (!topic) return '';
    const key = `name_${this.currentLanguage}`;
    return topic[key] || topic.name_uz || '';
  }
}