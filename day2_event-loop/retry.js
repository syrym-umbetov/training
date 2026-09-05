async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let i=maxAttempts; i>0;i--){
        try {
            return await fn()
        } catch (e){
            await new Promise(resolve => setTimeout(resolve, delay));
        }

    }
}

// Тест
let attempts = 0;
const unstableFunction = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Failed');
    return 'Success!';
};

retry(unstableFunction, 5, 500)
    .then(result => console.log(result)) // "Success!"
    .catch(error => console.error(error));