document.addEventListener('DOMContentLoaded', () => {
    // Обработка кликов по кнопкам начала урока
    document.querySelectorAll('.start-lesson-btn').forEach(button => {
        button.addEventListener('click', () => {
            const lessonId = button.closest('.lesson-card').dataset.lesson;
            window.location.href = `lesson.html?id=${lessonId}`;
        });
    });
}); 