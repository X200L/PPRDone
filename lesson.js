// Глобальные переменные
let currentScenario = null;
let currentStep = 0;
let score = 0;
let scenarios = null;
let isTheoryMode = true;

// DOM элементы
const lessonTitle = document.getElementById('lesson-title');
const scenarioDescription = document.getElementById('scenario-description');
const chatHistory = document.getElementById('chat-history');
const responseOptions = document.getElementById('response-options');
const scoreElement = document.getElementById('score');

// Получаем ID урока из URL
const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get('id');

// Загрузка сценариев
fetch('scenarios.json')
    .then(response => response.json())
    .then(data => {
        scenarios = data.scenarios;
        if (lessonId && scenarios[lessonId]) {
            startScenario(lessonId);
        } else {
            showError('Урок не найден');
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки сценариев:', error);
        showError('Ошибка загрузки урока');
    });

// Функции
function startScenario(scenarioId) {
    currentScenario = scenarios[scenarioId];
    currentStep = 0;
    score = 0;
    isTheoryMode = true;
    updateScore();
    
    // Устанавливаем заголовок урока
    lessonTitle.textContent = currentScenario.title;
    
    // Очищаем историю чата
    chatHistory.innerHTML = '';
    
    // Показываем теоретическую часть
    showTheory();
}

function showTheory() {
    // Очищаем предыдущие варианты ответов
    responseOptions.innerHTML = '';
    
    // Создаем контейнер для теории
    const theoryContainer = document.createElement('div');
    theoryContainer.className = 'theory-container';
    
    // Добавляем заголовок теории
    const theoryTitle = document.createElement('h3');
    theoryTitle.textContent = currentScenario.theory.title;
    theoryContainer.appendChild(theoryTitle);
    
    // Добавляем содержание теории
    const theoryContent = document.createElement('div');
    theoryContent.className = 'theory-content';
    currentScenario.theory.content.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        theoryContent.appendChild(p);
    });
    theoryContainer.appendChild(theoryContent);
    
    // Добавляем кнопку перехода к практике
    const startPracticeBtn = document.createElement('button');
    startPracticeBtn.className = 'start-practice-btn';
    startPracticeBtn.textContent = 'Начать практику';
    startPracticeBtn.addEventListener('click', () => {
        isTheoryMode = false;
        chatHistory.innerHTML = '';
        addMessage("Здравствуйте! Я менеджер по продажам. Чем могу помочь?", 'manager');
        showStep();
    });
    theoryContainer.appendChild(startPracticeBtn);
    
    // Добавляем теорию в чат
    chatHistory.appendChild(theoryContainer);
    
    // Прокручиваем чат вниз
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showStep() {
    const step = currentScenario.steps[currentStep];
    
    // Добавляем сообщение клиента только если это первый шаг
    if (currentStep === 0) {
        addMessage(step.clientMessage, 'client');
    }
    
    // Очищаем предыдущие варианты ответов
    responseOptions.innerHTML = '';
    
    // Добавляем новые варианты ответов
    step.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'response-btn';
        button.textContent = option.text;
        button.addEventListener('click', () => handleResponse(option));
        responseOptions.appendChild(button);
    });
}

function handleResponse(option) {
    score += option.score;
    updateScore();
    
    // Добавляем ответ менеджера
    addMessage(option.text, 'manager');
    
    // Добавляем комментарий к ответу
    addMessage(option.comment, 'system');
    
    // Показываем следующий шаг или завершаем сценарий
    if (option.nextMessage) {
        setTimeout(() => {
            addMessage(option.nextMessage, 'client');
            currentStep++;
            if (currentStep < currentScenario.steps.length) {
                showStep();
            } else {
                endScenario();
            }
        }, 500);
    }
}

function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatHistory.appendChild(messageDiv);
    
    // Прокручиваем чат вниз
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updateScore() {
    scoreElement.textContent = score;
}

function endScenario() {
    responseOptions.innerHTML = '<button class="scenario-btn" onclick="window.location.href=\'lessons.html\'">Вернуться к урокам</button>';
    addMessage(`Сценарий завершен! Ваш результат: ${score} очков.`, 'client');
}

function showError(message) {
    chatHistory.innerHTML = `
        <div class="error-message">
            <h3>Ошибка</h3>
            <p>${message}</p>
            <button class="scenario-btn" onclick="window.location.href='lessons.html'">Вернуться к урокам</button>
        </div>
    `;
} 