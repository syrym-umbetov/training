const memoizeWithTTL = (
    fn,
    ttl // время жизни кеша в миллисекундах
) => {
    const map = new Map()
    return (a) => {
        if (map.has(a)) return map.get(a)
        const value = fn(a)
        map.set(a, value)
        setTimeout(() => map.delete(a) ,ttl)
        return value
    }
}

const expensiveCalc = (n) => {
    console.log('Вычисляем...');
    return n * n;
};

const memoized = memoizeWithTTL(expensiveCalc, 2000); // TTL = 2 секунды

console.log(memoized(5)); // "Вычисляем..." → 25
console.log(memoized(5)); // → 25 (из кеша)

// Ждём 2+ секунды...
setTimeout(() => {
    console.log(memoized(5)); // "Вычисляем..." → 25 (кеш устарел)
}, 2500);