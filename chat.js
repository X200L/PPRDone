class CustomerSimulator {
    constructor() {
        this.products = {};
        this.questions = {};
        this.responses = {};
        this.initialized = false;
        this.currentProduct = null;
        this.askedQuestions = new Set();
        this.remainingQuestions = [];
        this.conversationState = 'greeting';
        this.lastQuestionType = null;
        this.positiveResponses = 0;
        this.negativeResponses = 0;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            this.products = data.products;
            this.questions = data.questions;
            this.responses = data.responses;
            this.initialized = true;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    selectRandomProduct() {
        const productKeys = Object.keys(this.products);
        const randomKey = productKeys[Math.floor(Math.random() * productKeys.length)];
        this.currentProduct = this.products[randomKey];
        return this.currentProduct;
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
        
        if (messageLower.includes('Да') || 
            messageLower.includes('Конечно') || 
            messageLower.includes('ага') || 
            messageLower.includes('Хорошо') || 
            messageLower.includes('Отлично') ||
            messageLower.includes('давай') ||
            messageLower.includes('согласен')) {
            this.positiveResponses++;
            return 'positive';
        }
        
        if (messageLower.includes('нет') || 
            messageLower.includes('не') || 
            messageLower.includes('сомневаюсь') || 
            messageLower.includes('дорого') || 
            messageLower.includes('сложно') ||
            messageLower.includes('долго')) {
            this.negativeResponses++;
            return 'negative';
        }
        
        return 'neutral';
    }

    getResponse(message) {
        if (!this.initialized) {
            throw new Error('CustomerSimulator not initialized. Call initialize() first.');
        }

        const responseType = this.analyzeUserResponse(message);
        
        if (this.askedQuestions.size >= 2) {
            if (this.positiveResponses >= 2 && Math.random() < 0.4) {
                this.conversationState = 'decision';
                const decisionResponse = this.responses.decision[Math.floor(Math.random() * this.responses.decision.length)];
                const confirmations = [
                    "Отлично! Я рад, что вы приняли решение. Давайте я расскажу подробнее о курсе.",
                    "Прекрасный выбор! Сейчас я предоставлю вам полную информацию о программе.",
                    "Замечательно! Я подготовлю для вас детальную информацию о курсе."
                ];
                return `${decisionResponse}\n\n${confirmations[Math.floor(Math.random() * confirmations.length)]}`;
            }
            
            if (this.negativeResponses >= 2) {
                const concernResponse = this.getConcernResponse();
                if (concernResponse) {
                    return concernResponse;
                }
            }
        }

        let question = this.getRandomQuestion();
        
        let contextualResponse = '';
        if (responseType === 'positive') {
            contextualResponse = this.responses.interest[Math.floor(Math.random() * this.responses.interest.length)];
        } else if (responseType === 'negative') {
            contextualResponse = this.responses.hesitation[Math.floor(Math.random() * this.responses.hesitation.length)];
        }
        
        if (contextualResponse) {
            return `${contextualResponse}\n\n${question}`;
        }
        
        return question;
    }

    getConcernResponse() {
        const concerns = {
            'price': [
                "Понимаю ваши опасения по поводу цены. У нас есть рассрочка, и вы можете начать с небольшого платежа.",
                "Цена может показаться высокой, но учтите, что это инвестиция в ваше будущее. После курса вы сможете зарабатывать значительно больше."
            ],
            'duration': [
                "Курс действительно требует времени, но вы можете учиться в своем темпе и совмещать с работой.",
                "Длительность обучения оптимальна для качественного усвоения материала. При этом вы получаете доступ к материалам навсегда."
            ],
            'features': [
                "Давайте я подробнее расскажу о том, что входит в программу. Возможно, это поможет вам принять решение.",
                "У нас есть пробный урок, где вы можете оценить качество обучения и формат."
            ]
        };

        if (this.lastQuestionType && concerns[this.lastQuestionType]) {
            return concerns[this.lastQuestionType][Math.floor(Math.random() * concerns[this.lastQuestionType].length)];
        }

        return null;
    }

    getProductInfo() {
        if (!this.currentProduct) {
            this.selectRandomProduct();
        }
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

    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatProductInfo(product) {
        return `Курс: ${product.name}\nЦена: ${product.price}\nДлительность: ${product.duration}\n\nЧто входит:\n${product.features.map(f => `- ${f}`).join('\n')}\n\nПреимущества:\n${product.benefits.map(b => `- ${b}`).join('\n')}`;
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

            if (customerSimulator.conversationState === 'decision') {
                const product = customerSimulator.getProductInfo();
                addMessage(formatProductInfo(product));
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