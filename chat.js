class TaskGenerator {
    constructor() {
        this.templates = [];
        this.domainTerms = {};
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            this.templates = data.templates;
            this.domainTerms = data.domainTerms;
            this.initialized = true;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    getDomain(prompt) {
        const promptLower = prompt.toLowerCase();
        if (promptLower.includes('искусственн') || promptLower.includes('нейросет') || promptLower.includes('машинн') || promptLower.includes('алгоритм')) {
            return 'ai';
        } else if (promptLower.includes('экономик') || promptLower.includes('финанс') || promptLower.includes('предприят') || promptLower.includes('рынок')) {
            return 'economics';
        } else if (promptLower.includes('экологи') || promptLower.includes('природ') || promptLower.includes('эколог') || promptLower.includes('окружающ')) {
            return 'ecology';
        }
        return 'other';
    }

    generate(prompt) {
        if (!this.initialized) {
            throw new Error('TaskGenerator not initialized. Call initialize() first.');
        }

        const domain = this.getDomain(prompt);
        const terms = this.domainTerms[domain];
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];
        
        const replacements = {};
        const placeholders = template.match(/\{(\w+)\}/g).map(p => p.slice(1, -1));
        
        for (const ph of placeholders) {
            if (terms[ph] && terms[ph].length > 0) {
                replacements[ph] = terms[ph][Math.floor(Math.random() * terms[ph].length)];
            } else {
                replacements[ph] = 'исследуемого объекта';
            }
        }

        const topic = template.replace(/\{(\w+)\}/g, (match, key) => replacements[key]).charAt(0).toUpperCase() + template.replace(/\{(\w+)\}/g, (match, key) => replacements[key]).slice(1);

        const criteriaOptions = [
            `Анализ ${terms['aspect'][Math.floor(Math.random() * terms['aspect'].length)]}`,
            `Исследование ${terms['process'][Math.floor(Math.random() * terms['process'].length)]}`,
            `Разработка ${terms['solution'][Math.floor(Math.random() * terms['solution'].length)]}`,
            `Оценка ${terms['aspect'][Math.floor(Math.random() * terms['aspect'].length)]}`,
            `Сравнение ${terms['item'][Math.floor(Math.random() * terms['item'].length)]}`
        ];

        const criteria = criteriaOptions.sort(() => Math.random() - 0.5).slice(0, 3);
        const isDiploma = prompt.toLowerCase().includes('диплом') || prompt.toLowerCase().includes('выпускн');
        const deadline = isDiploma ? 
            `${Math.floor(Math.random() * 3) + 4} месяца` : 
            `${Math.floor(Math.random() * 3) + 2} ${Math.random() > 0.5 ? 'недели' : 'месяца'}`;

        return {
            topic,
            criteria,
            deadline
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const loadingIndicator = document.getElementById('loading');
    const taskGenerator = new TaskGenerator();

    await taskGenerator.initialize();

    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatResponse(response) {
        return `Тема: ${response.topic}\n\nКритерии:\n${response.criteria.map(c => `- ${c}`).join('\n')}\n\nСрок: ${response.deadline}`;
    }

    async function handleUserInput() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        userInput.value = '';
        loadingIndicator.style.display = 'block';

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = taskGenerator.generate(text);
            loadingIndicator.style.display = 'none';
            addMessage(formatResponse(response));
        } catch (error) {
            loadingIndicator.style.display = 'none';
            addMessage('Извините, произошла ошибка при генерации ответа. Пожалуйста, попробуйте еще раз.');
            console.error('Error generating response:', error);
        }
    }

    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
}); 