const createBankAccount = (init) => {
    return {
        deposit: (money) => {
            init += money
        },
        withdraw: (money) => {
            if (init - money < 0) {throw new Error('Ты охуел?')}
            init -= money
        },
        getBalance: () => init
    }
}


const account1 = createBankAccount(1000); // Начальный баланс 1000
const account2 = createBankAccount(500);

account1.deposit(500);
console.log(account1.getBalance()); // 1500

account1.withdraw(200);
console.log(account1.getBalance()); // 1300

account1.withdraw(2000); // Должно вернуть false или выбросить ошибку
console.log(account1.getBalance()); // 1300 (не изменился)

console.log(account2.getBalance()); // 500 (независимый счёт!)

// ⚠️ Это НЕ должно работать:
console.log(account1.balance); // undefined
