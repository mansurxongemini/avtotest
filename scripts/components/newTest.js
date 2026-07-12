import { NewQuestions } from '../../data/newQuestions.js';

export class NewTestManager {
    constructor(languageSwitcher, imageModal) {
        this.languageSwitcher = languageSwitcher;
        this.imageModal = imageModal;
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.filteredQuestions = [];
        this.correctAnswers = [];
        this.userAnswers = [];
        this.totalQuestionsAnswered = 0;
        this.totalMistakes = 0;
    }

    // Initialize the new test
    init() {
        console.log('Initializing New Test with NewQuestions');
        
        // Convert new questions structure to compatible format
        this.filteredQuestions = NewQuestions.map(question => ({
            ...question,
            // Convert new structure to old structure for compatibility
            oraliq_dars: question.lesson,
            question_uz: question.question.uz,
            question_ru: question.question.ru,
            question_cry: question.question.cry,
            // Store original new structure in a custom property
            _newStructure: question
        }));

        console.log('Converted questions:', this.filteredQuestions);
        
        // Reset state
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.correctAnswers = new Array(this.filteredQuestions.length).fill(undefined);
        this.userAnswers = [];
        this.totalQuestionsAnswered = 0;
        this.totalMistakes = 0;

        // Display the first question
        this.displayQuestion();
        this.generateTestNavigation();
    }

    // Display current question and answers
    displayQuestion() {
        const questionContainer = document.querySelector('#question');
        const questionImageContainer = document.querySelector('#question-image');
        const answersContainer = document.querySelector('#answers');

        if (this.filteredQuestions.length === 0) {
            questionContainer.innerText = "No questions available.";
            answersContainer.innerHTML = "";
            return;
        }

        const question = this.filteredQuestions[this.currentQuestionIndex];
        // Rasmlarni lokal papkadan emas, to'g'ridan-to'g'ri onlayn Vercel saytidan oladi
        const questionImage = question.image ? `https://ferdavs-avtotest.vercel.app/${question.image}` : "./logo.png";

        // For new questions, use simplified structure
        const questionText = this.languageSwitcher.getQuestionText(question);
        const chapterId = "3";
        const topicNumber = "1";

        questionContainer.innerHTML = `
            <div>${chapterId}.${topicNumber} ${questionText}</div>
        `;
        
        questionImageContainer.innerHTML = `
            <img src="${questionImage}" alt="Question Image" style="cursor: pointer;">
        `;
        
        // Add click handler to open image in modal
        const imgElement = questionImageContainer.querySelector('img');
        if (imgElement && this.imageModal) {
            imgElement.addEventListener('click', () => {
                this.imageModal.open(questionImage);
            });
        }
        
        answersContainer.innerHTML = "";

        // Get answers from new structure
        const filteredAnswers = question._newStructure.answers.map(answer => ({
            id: answer.id,
            answer_uz: answer.text.uz,
            answer_ru: answer.text.ru,
            answer_cry: answer.text.cry,
            is_true: answer.isCorrect
        }));

        const optionLabels = ["F1", "F2", "F3", "F4", "F5"];

        filteredAnswers.forEach((answer, index) => {
            const answerElement = document.createElement("div");
            answerElement.className = "answer";

            // Create span for option label
            const optionSpan = document.createElement("span");
            optionSpan.className = "option-label";
            optionSpan.innerText = optionLabels[index] || "";

            // Create span for answer text
            const textSpan = document.createElement("span");
            textSpan.innerText = this.languageSwitcher.getAnswerText(answer);

            // Append spans to answer element
            answerElement.appendChild(optionSpan);
            answerElement.appendChild(textSpan);

            // Check if the user has already answered this question
            const userAnswer = this.userAnswers[this.currentQuestionIndex];
            if (userAnswer) {
                if (userAnswer.answerId === answer.id) {
                    if (userAnswer.isCorrect) {
                        answerElement.classList.add("correct-answer");
                    } else {
                        answerElement.classList.add("incorrect-answer");
                    }
                }
                if (answer.is_true) {
                    answerElement.classList.add("correct-answer");
                }
            }

            // Add click event listener
            answerElement.addEventListener("click", () => {
                if (!this.selectedAnswer) {
                    this.selectedAnswer = answer;
                    document
                        .querySelectorAll(".answer")
                        .forEach((a) => a.classList.remove("selected"));
                    answerElement.classList.add("selected");
                    this.checkAnswer(answerElement);
                }
            });

            answersContainer.appendChild(answerElement);
        });

        // Update navigation buttons
        const prevButton = document.querySelector('#prev');
        const nextButton = document.querySelector('#next');
        prevButton.disabled = this.currentQuestionIndex === 0;
        nextButton.disabled = this.currentQuestionIndex === this.filteredQuestions.length - 1;

        // Update test navigation boxes
        this.updateTestNavigation();
    }

    // Check the selected answer
    checkAnswer(answerElement) {
        if (this.selectedAnswer) {
            this.totalQuestionsAnswered++;

            // Store the user's answer and correctness
            this.userAnswers[this.currentQuestionIndex] = {
                answerId: this.selectedAnswer.id,
                isCorrect: this.selectedAnswer.is_true,
            };

            const resultElement = document.querySelector('#result');

            if (this.selectedAnswer.is_true) {
                answerElement.classList.add("correct-answer");
                this.correctAnswers[this.currentQuestionIndex] = true;
                resultElement.innerText = "Correct!";
            } else {
                answerElement.classList.add("incorrect-answer");
                this.correctAnswers[this.currentQuestionIndex] = false;
                this.totalMistakes++;
                resultElement.innerText = "Incorrect!";

                // Find and highlight the correct answer
                const allAnswerElements = document.querySelector('#answers').getElementsByClassName("answer");
                const question = this.filteredQuestions[this.currentQuestionIndex];
                const filteredAnswers = question._newStructure.answers.map(answer => ({
                    id: answer.id,
                    answer_uz: answer.text.uz,
                    answer_ru: answer.text.ru,
                    answer_cry: answer.text.cry,
                    is_true: answer.isCorrect
                }));

                filteredAnswers.forEach((answer, index) => {
                    if (answer.is_true) {
                        allAnswerElements[index].classList.add("correct-answer");
                    }
                });
            }
            
            this.updatePercentageDisplay();
            this.updateTestNavigation();
            
            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        }
    }

    // Move to the next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.selectedAnswer = null;
            const resultElement = document.querySelector('#result');
            resultElement.innerText = "";
            this.displayQuestion();
        }
    }

    // Move to the previous question
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.selectedAnswer = null;
            const resultElement = document.querySelector('#result');
            resultElement.innerText = "";
            this.displayQuestion();
        }
    }

    // Navigate to specific question
    goToQuestion(index) {
        if (index >= 0 && index < this.filteredQuestions.length) {
            this.currentQuestionIndex = index;
            this.selectedAnswer = null;
            const resultElement = document.querySelector('#result');
            resultElement.innerText = "";
            this.displayQuestion();
        }
    }

    // Update percentage display
    updatePercentageDisplay() {
        const percentage = 100 - (this.totalMistakes / this.totalQuestionsAnswered) * 100;
        const percentageDisplay = document.querySelector('#percentageDisplay');
        percentageDisplay.innerText = `Tog'ri Javoblar: ${percentage.toFixed(2)}%`;
        percentageDisplay.classList.remove("hidden");

        if (percentage < 90) {
            percentageDisplay.classList.add("low-percentage");
        } else {
            percentageDisplay.classList.remove("low-percentage");
        }
    }

    // Generate test navigation boxes
    generateTestNavigation() {
        const testNavigation = document.querySelector('#test-navigation');
        testNavigation.innerHTML = "";

        this.filteredQuestions.forEach((_, index) => {
            const navBox = document.createElement("div");
            navBox.textContent = index + 1;
            navBox.classList.add("nav-box");
            
            if (this.correctAnswers[index] !== undefined) {
                navBox.classList.add(this.correctAnswers[index] ? "correct" : "incorrect");
            }
            
            navBox.addEventListener("click", () => {
                this.goToQuestion(index);
            });
            
            testNavigation.appendChild(navBox);
        });
    }

    // Update test navigation boxes
    updateTestNavigation() {
        const navBoxes = document.querySelectorAll(".nav-box");
        navBoxes.forEach((box, index) => {
            // Remove all state classes first
            box.classList.remove("active", "correct", "incorrect");
            
            // Add correct/incorrect classes only if question has been answered
            if (this.correctAnswers[index] === true) {
                box.classList.add("correct");
            } else if (this.correctAnswers[index] === false) {
                box.classList.add("incorrect");
            }
            
            // Add active class to current question only if not answered
            if (index === this.currentQuestionIndex) {
                box.classList.add("active");
            }
        });
    }

    // Get current state for external access
    getState() {
        return {
            currentQuestionIndex: this.currentQuestionIndex,
            filteredQuestions: this.filteredQuestions,
            correctAnswers: this.correctAnswers,
            userAnswers: this.userAnswers,
            totalQuestionsAnswered: this.totalQuestionsAnswered,
            totalMistakes: this.totalMistakes
        };
    }
}

