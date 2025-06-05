class CustomerSimulator {
    constructor() {
        this.products = {};
        this.questions = {};
        this.responses = {};
        this.trustKeywords = {};
        this.initialized = false;
        this.currentProduct = null;
        this.askedQuestions = new Set();
        this.remainingQuestions = [];
        this.conversationState = 'greeting';
        this.lastQuestionType = null;
        this.positiveResponses = 0;
        this.negativeResponses = 0;
        this.concernsRaised = new Set();
        this.agreementLevel = 0;
        this.lastResponseType = null;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            this.products = data.products;
            this.questions = data.questions;
            this.responses = data.responses;
            this.trustKeywords = data.trust_keywords;
            this.initialized = true;
            this.currentProduct = this.products.auto_services;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    getRandomQuestion() {
        if (this.remainingQuestions.length === 0) {
            this.remainingQuestions = Object.keys(this.questions);
        }

        const randomIndex = Math.floor(Math.random() * this.remainingQuestions.length);
        const questionType = this.remainingQuestions[randomIndex];
        this.remainingQuestions.splice(randomIndex, 1);

        const questions = this.questions[questionType];
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        this.askedQuestions.add(questionType);
        this.lastQuestionType = questionType;

        return randomQuestion;
    }

    analyzeUserResponse(message) {
        const messageLower = message.toLowerCase();
        let trustChange = 0;
        
        // Анализ ключевых слов для определения типа ответа
        if (messageLower.includes('цена') || messageLower.includes('стоимость') || messageLower.includes('руб')) {
            this.concernsRaised.add('price');
        }
        
        if (messageLower.includes('внедр') || messageLower.includes('установк') || messageLower.includes('настройк')) {
            this.concernsRaised.add('implementation');
        }
        
        if (messageLower.includes('качеств') || messageLower.includes('гарант') || messageLower.includes('поддержк')) {
            this.concernsRaised.add('quality');
        }
        
        if (messageLower.includes('эконом') || messageLower.includes('сэконом') || messageLower.includes('выгод')) {
            this.concernsRaised.add('savings');
        }
        
        if (messageLower.includes('преимуществ') || messageLower.includes('лучше') || messageLower.includes('уникальн')) {
            this.concernsRaised.add('advantages');
        }

        // Проверка положительных ключевых слов
        const positiveCount = this.trustKeywords.positive.filter(word => messageLower.includes(word)).length;
        if (positiveCount > 0) {
            this.positiveResponses++;
            trustChange += positiveCount * this.trustKeywords.weights.positive;
            this.lastResponseType = 'positive';
        }

        // Проверка отрицательных ключевых слов
        const negativeCount = this.trustKeywords.negative.filter(word => messageLower.includes(word)).length;
        if (negativeCount > 0) {
            this.negativeResponses++;
            trustChange -= negativeCount * this.trustKeywords.weights.negative;
            this.lastResponseType = 'negative';
        }

        // Проверка ключевых слов доверия
        const trustCount = this.trustKeywords.trust.filter(word => messageLower.includes(word)).length;
        if (trustCount > 0) {
            trustChange += trustCount * this.trustKeywords.weights.trust;
        }

        // Проверка срочности
        const urgencyCount = this.trustKeywords.urgency.filter(word => messageLower.includes(word)).length;
        if (urgencyCount > 0) {
            trustChange += urgencyCount * this.trustKeywords.weights.urgency;
        }

        // Обновление уровня согласия с учетом всех факторов
        this.agreementLevel = Math.min(100, Math.max(0, this.agreementLevel + trustChange));

        // Определение типа ответа на основе общего анализа
        if (trustChange > 0) {
            return 'positive';
        } else if (trustChange < 0) {
            return 'negative';
        }
        
        this.lastResponseType = 'neutral';
        return 'neutral';
    }

    getResponse(message) {
        if (!this.initialized) {
            throw new Error('CustomerSimulator not initialized. Call initialize() first.');
        }

        const responseType = this.analyzeUserResponse(message);
        
        if (this.concernsRaised.size > 0) {
            const concerns = Array.from(this.concernsRaised);
            const randomConcern = concerns[Math.floor(Math.random() * concerns.length)];
            if (this.questions[randomConcern + '_concerns']) {
                const questions = this.questions[randomConcern + '_concerns'];
                return questions[Math.floor(Math.random() * questions.length)];
            }
        }
        
        if (this.askedQuestions.size >= 2) {
            if (this.positiveResponses >= 2 && Math.random() < 0.4) {
                this.conversationState = 'decision';
                return this.responses.decision[Math.floor(Math.random() * this.responses.decision.length)];
            }
            
            if (this.negativeResponses >= 2) {
                return this.responses.objections[Math.floor(Math.random() * this.responses.objections.length)];
            }
        }

        let question = this.getRandomQuestion();
        
        let contextualResponse = '';
        if (responseType === 'positive') {
            contextualResponse = this.responses.positive_reactions[Math.floor(Math.random() * this.responses.positive_reactions.length)];
        } else if (responseType === 'negative') {
            contextualResponse = this.responses.negative_reactions[Math.floor(Math.random() * this.responses.negative_reactions.length)];
        } else {
            contextualResponse = this.responses.neutral_reactions[Math.floor(Math.random() * this.responses.neutral_reactions.length)];
        }
        
        if (contextualResponse) {
            return `${contextualResponse}\n\n${question}`;
        }
        
        return question;
    }

    getProductInfo() {
        return this.currentProduct;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const loadingIndicator = document.getElementById('loading');
    const customerSimulator = new CustomerSimulator();

    await customerSimulator.initialize();

    function updateAgreementLevel(level) {
        const progressBar = document.querySelector('.agreement-progress');
        const valueText = document.querySelector('.agreement-value');
        progressBar.style.width = `${level}%`;
        valueText.textContent = `${level}%`;
        
        if (level < 30) {
            progressBar.style.backgroundColor = '#ff4d4d';
        } else if (level < 70) {
            progressBar.style.backgroundColor = '#ffd700';
        } else {
            progressBar.style.backgroundColor = '#4CAF50';
        }
    }

    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatProductInfo(product) {
        if (customerSimulator.conversationState === 'decision') {
            return `Отлично! Вы прошли практику`;
        }
        return `Комплексное обслуживание корпоративного автотранспорта\n\nЧто входит:\n${product.features.map(f => `- ${f}`).join('\n')}\n\nПреимущества:\n${product.benefits.map(b => `- ${b}`).join('\n')}`;
    }

    async function handleUserInput() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        userInput.value = '';
        loadingIndicator.style.display = 'block';

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = customerSimulator.getResponse(text);
            loadingIndicator.style.display = 'none';
            addMessage(response);
            
            updateAgreementLevel(customerSimulator.agreementLevel);

            if (customerSimulator.conversationState === 'decision') {
                const product = customerSimulator.getProductInfo();
                addMessage(formatProductInfo(product));
                addMessage("Для начала работы нам потребуются следующие документы:\n- Реквизиты компании\n- Список автомобилей\n- Контактные данные ответственного лица");
            }
        } catch (error) {
            loadingIndicator.style.display = 'none';
            addMessage('Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.');
            console.error('Error generating response:', error);
        }
    }

    const greeting = customerSimulator.responses.greeting[Math.floor(Math.random() * customerSimulator.responses.greeting.length)];
    addMessage(greeting);

    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
}); 