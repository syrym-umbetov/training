function once(fn) {
    let value = null
    return (a) => {
        if (!value) {
            value = fn(a)
        }
        return value
    }
}

// Пример использования:
const expensiveOperation = (x) => {
    console.log('Выполняется дорогая операция...');
    return x * 2;
};

const onceOperation = once(expensiveOperation);

console.log(onceOperation(5));  // "Выполняется..." → 10
console.log(onceOperation(10)); // → 10 (не выполняется, возвращает кешированный результат)
console.log(onceOperation(20)); // → 10 (тоже кеш)

const getZero = () => {
    console.log('Executed!');
    return 0;
};

const onceZero = once(getZero);
console.log(onceZero()); // "Executed!" → 0 ✓
console.log(onceZero()); // "Executed!" → 0 ❌ (должно быть из кеша!)