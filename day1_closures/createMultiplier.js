
const createMultiplier = (factor) => {
    let count = 0
    let history = []

    const multiplier = (a) => {
        history.push(a)
        ++count
        return a * factor
    }
    multiplier.getCallCount = () => count
    multiplier.reset = () => {
        count = 0
        history = []
    }
    multiplier.getHistory = () => history
    multiplier.setFactor = (newFactor) => factor = newFactor
    multiplier.getLastResult =() => history[history.length - 1] * factor

    return multiplier

}

const triple = createMultiplier(3);

console.log(triple(5));              // 15
console.log(triple(10));             // 30
console.log(triple.getCallCount());  // 2
console.log(triple.getHistory());    // [5, 10]
console.log(triple.getLastResult()); // 30

triple.setFactor(4);
console.log(triple(5));              // 20

triple.reset();
console.log(triple.getCallCount());  // 0
console.log(triple.getHistory());    // []