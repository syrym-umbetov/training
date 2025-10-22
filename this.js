const Calculator = {
    value: 0,
    add(n) {
        this.value += n;
        return this
    },
    subtract (n) {
        this.value -= n;
        return this
    },
    multiply(n) {
        this.value *= n;
        return this
    },
    divide (n) {
        this.value /= n;
        return this
    },
    reset (){
        this.value = 0;
        return this

    },
    getResult (){
        return this.value
    }
}
const result = Calculator
    .add(10)
    .multiply(2)
    .subtract(5)
    .divide(3)
    .getResult();

function createCalculator(initialValue = 0) {
    const obj = Object.create(Calculator)
    obj.value = initialValue;
    return obj
}
const calc1 = createCalculator(100).add(50).getResult()
const calc2 = createCalculator(50)
console.log(calc1)