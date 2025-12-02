// Базовый URL API
const API_BASE_URL = '/auth';

// Утилиты для работы с localStorage
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Ошибка сохранения в localStorage:', e);
        }
    },
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Ошибка чтения из localStorage:', e);
            return null;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Ошибка удаления из localStorage:', e);
        }
    }
};

// Функция для отображения ошибок
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        // Автоматически скрыть через 5 секунд
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }
}

// Функция для скрытия ошибок
function hideError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

// Функция для отображения успешных сообщений
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
        setTimeout(() => {
            successDiv.classList.remove('show');
        }, 3000);
    }
}

// Функция для обработки ошибок API
async function handleApiError(response) {
    let errorMessage = 'Произошла ошибка при выполнении запроса';
    
    try {
        const data = await response.json();
        if (data.detail) {
            errorMessage = data.detail;
        } else if (data.message) {
            errorMessage = data.message;
        }
    } catch (e) {
        // Если не удалось распарсить JSON, используем стандартное сообщение
        switch (response.status) {
            case 400:
                errorMessage = 'Неверные данные запроса';
                break;
            case 401:
                errorMessage = 'Неверный логин/email или пароль';
                break;
            case 403:
                errorMessage = 'Доступ запрещен';
                break;
            case 404:
                errorMessage = 'Ресурс не найден';
                break;
            case 500:
                errorMessage = 'Внутренняя ошибка сервера';
                break;
            default:
                errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
    }
    
    return errorMessage;
}

// Функция регистрации
async function register(event) {
    event.preventDefault();
    hideError();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Получаем данные формы
    const formData = new FormData(form);
    const data = {
        login: formData.get('login'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    // Валидация на клиенте
    if (!data.role || (data.role !== 'Студент' && data.role !== 'Организатор')) {
        showError('Выберите роль: Студент или Организатор');
        return;
    }
    
    if (!data.login || data.login.length < 3) {
        showError('Логин должен содержать минимум 3 символа');
        return;
    }
    
    if (!data.email || !data.email.includes('@')) {
        showError('Введите корректный email');
        return;
    }
    
    if (!data.password || data.password.length < 8) {
        showError('Пароль должен содержать минимум 8 символов');
        return;
    }
    
    // Показываем индикатор загрузки
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span>Регистрация...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const userData = await response.json();
            // Сохраняем данные пользователя
            storage.set('user', userData);
            showSuccess('Регистрация успешна! Перенаправление...');
            // Перенаправляем на главную страницу через 1 секунду
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            const errorMessage = await handleApiError(response);
            showError(errorMessage);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showError('Ошибка подключения к серверу. Проверьте подключение к интернету.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Функция авторизации
async function login(event) {
    event.preventDefault();
    hideError();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Получаем данные формы
    const formData = new FormData(form);
    const loginValue = formData.get('login')?.trim() || '';
    const password = formData.get('password');
    const role = formData.get('role');
    
    // Валидация роли
    if (!role || (role !== 'Студент' && role !== 'Организатор')) {
        showError('Выберите роль: Студент или Организатор');
        return;
    }
    
    // Определяем, что введено - login или email
    const inputValue = loginValue;
    const isEmail = inputValue.includes('@');
    
    // Формируем данные для отправки
    const data = {
        password: password,
        role: role
    };
    
    // Добавляем login или email в зависимости от того, что введено
    if (isEmail) {
        data.email = inputValue;
        data.login = null;
    } else {
        data.login = inputValue;
        data.email = null;
    }
    
    // Валидация
    if (!inputValue) {
        showError('Введите логин или email');
        return;
    }
    
    if (!password || password.length < 8) {
        showError('Пароль должен содержать минимум 8 символов');
        return;
    }
    
    // Показываем индикатор загрузки
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span>Вход...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const userData = await response.json();
            // Сохраняем данные пользователя
            storage.set('user', userData);
            showSuccess('Вход выполнен успешно! Перенаправление...');
            // Перенаправляем на главную страницу через 1 секунду
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            const errorMessage = await handleApiError(response);
            showError(errorMessage);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        showError('Ошибка подключения к серверу. Проверьте подключение к интернету.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Функция выхода
function logout() {
    storage.remove('user');
    window.location.href = '/login';
}

// Функция загрузки информации о пользователе
async function loadUserInfo() {
    const user = storage.get('user');
    if (!user) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        window.location.href = '/login';
        return;
    }
    
    // Отображаем информацию о пользователе
    const userInfoDiv = document.getElementById('user-info');
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `
            <h2>Добро пожаловать, ${user.login}!</h2>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Логин:</strong> ${user.login}</p>
            <p><strong>Роль:</strong> ${user.role}</p>
            <p><strong>Дата регистрации:</strong> ${new Date(user.created_at).toLocaleString('ru-RU')}</p>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Регистрация обработчиков форм
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', register);
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    // Загрузка информации о пользователе на главной странице
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        loadUserInfo();
    }
    
    // Обработчик кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

