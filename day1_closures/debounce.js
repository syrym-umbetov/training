function debounce(
    fn,
    delay
) {
    let timer = null;
    return (text) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(text), delay);
    }
}

// Пример использования:
const log = (text) => console.log(text);
const debouncedLog = debounce(log, 1000);

debouncedLog('Первый');  // Ждём...
debouncedLog('Второй');  // Отменяем предыдущий, ждём...
debouncedLog('Третий');  // Отменяем предыдущий, ждём...

// Через 1 секунду после последнего вызова:
// → "Третий" (только последний выполнился)