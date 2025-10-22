/**
 * Простой менеджер состояний с поддержкой подписок и селекторов
 */
class SimpleStore {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = []; // Массив слушателей [{ listener, selector }]
    }

    getState(selector = null) {
        if (selector === null) {
            return this.state;
        } else {
            return selector(this.state);
        }
    }

    setState(updater) {
        // Обновляем состояние иммутабельно
        if (typeof updater === 'function') {
            this.state = updater(this.state);
        } else {
            this.state = { ...this.state, ...updater };
        }

        // Уведомляем всех подписчиков
        this._notifyListeners();
    }

    subscribe(listener, selector = null) {
        // Добавляем слушателя в список
        const subscription = { listener, selector };
        this.listeners.push(subscription);

        // Возвращаем функцию отписки
        return () => {
            const index = this.listeners.indexOf(subscription);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Приватный метод для уведомления подписчиков
    _notifyListeners() {
        this.listeners.forEach(({ listener, selector }) => {
            if (selector) {
                // Если есть селектор, передаём выбранную часть состояния
                listener(selector(this.state));
            } else {
                // Иначе передаём всё состояние
                listener(this.state);
            }
        });
    }
}

// Пример использования:
const store = new SimpleStore({
    user: {
        name: 'Арман',
        age: 28
    },
    posts: [
        { id: 1, title: 'Первый пост' },
        { id: 2, title: 'Второй пост' }
    ],
    ui: {
        theme: 'light',
        sidebar: 'collapsed'
    }
});

// Получение состояния
console.log(store.getState()); // Всё состояние
console.log(store.getState(state => state.user)); // Только user

// Подписка на всё состояние
const unsubscribe1 = store.subscribe(state => {
    console.log('Состояние изменилось:', state);
});

// Подписка только на user
const unsubscribe2 = store.subscribe(
    user => console.log('Пользователь изменился:', user),
    state => state.user
);

// Обновление состояния объектом
store.setState({ ui: { ...store.getState().ui, theme: 'dark' } });

// Обновление состояния функцией
store.setState(state => ({
    ...state,
    user: {
        ...state.user,
        age: state.user.age + 1
    }
}));

// Отписка
unsubscribe1();
unsubscribe2();