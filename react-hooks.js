/**
 * Хук useLocalStorage - для сохранения и чтения данных из localStorage с синхронизацией
 * @param {string} key - ключ для localStorage
 * @param {any} initialValue - начальное значение
 * @returns {Array} [value, setValue] - как в useState, но с сохранением в localStorage
 */
function useLocalStorage(key, initialValue) {
    return [localStorage.getItem(key) || initialValue, () => localStorage.setItem(key, initialValue)]
}

/**
 * Хук useDebounce - для задержки значения (полезно для поиска и API-запросов)
 * @param {any} value - значение для дебаунса
 * @param {number} delay - задержка в мс
 * @returns {any} - отложенное значение
 */
function useDebounce(value, delay) {
    return () => setTimeout(()=> value, delay)
}

/**
 * Хук useFetch - для выполнения и кэширования API-запросов
 * @param {string} url - URL для запроса
 * @param {Object} options - опции для fetch
 * @returns {Object} { data, error, loading, refetch } - данные и состояние запроса
 */
function useFetch(url, options = {}) {
    const object = {
        data: null,
        error: null,
        loading: false,
        refetch: () => {}
    }
    try {
        useEffect(()=>{
            const getData = async () => {
                object['loading'] = true
                const response = await fetch(url, options);
                object['data'] = response.json()
            }
            object['refetch'] = getData
            getData()
        },[])
    } catch(e) {
        object['error'] = new Error(e)
    } finally {
        object['loading'] = false
        return object
    }
}

// Примеры использования:

// 1. useLocalStorage
function ProfileSettings() {
    const [theme, setTheme] = useLocalStorage('theme', 'light');

    return (
        <div>
            <h2>Настройки профиля</h2>
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
            >
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
            </select>
        </div>
    );
}

// 2. useDebounce
function SearchComponent() {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);

    // searchAPI вызывается только после 500мс паузы ввода
    useEffect(() => {
        if (debouncedQuery) {
            searchAPI(debouncedQuery);
        }
    }, [debouncedQuery]);

    return (
        <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск..."
        />
    );
}

// 3. useFetch
function UserProfile({ userId }) {
    const { data, error, loading, refetch } = useFetch(
        `https://api.example.com/users/${userId}`
    );

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка: {error.message}</div>;

    return (
        <div>
            <h2>{data.name}</h2>
            <p>Email: {data.email}</p>
            <button onClick={refetch}>Обновить</button>
        </div>
    );
}