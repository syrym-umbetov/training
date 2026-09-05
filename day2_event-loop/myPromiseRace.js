async function myPromiseRace(promises) {
    return new Promise((resolve, reject) => {
        promises.forEach((promise) => {
            Promise.resolve(promise).then((value) => resolve(value)).catch(reject)
        })
    })
}

// Тест
const p1 = new Promise(resolve => setTimeout(() => resolve('First'), 100));
const p2 = new Promise(resolve => setTimeout(() => resolve('Second'), 150));

myPromiseRace([p1, p2]).then(console.log); // "Second"