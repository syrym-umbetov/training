function curry(fn) {
    let variablesCount = 0
    let array = []
    return function recursion (...args) {
        variablesCount += args.length
        array.push(...args)
        if (variablesCount < fn.length) {
            return recursion
        }
        if (variablesCount === fn.length) {
            return fn(...array)
        }
        if (variablesCount > fn.length) {
            variablesCount = args.length
            array = []
            array.push(...args)
            return recursion
        }
    };
}

// Пример 1: функция с 3 параметрами
const sum = (a, b, c) => a + b + c;
const curriedSum = curry(sum);

console.log(curriedSum(1)(2)(3));     // 6
console.log(curriedSum(1, 2)(3));     // 6 (можно передавать несколько)
console.log(curriedSum(1)(2, 3));     // 6

// Пример 2: функция с 2 параметрами
const multiply = (x, y) => x * y;
const curriedMultiply = curry(multiply);

const double = curriedMultiply(2);
console.log(double(5)); // 10
console.log(double(8)); // 16
