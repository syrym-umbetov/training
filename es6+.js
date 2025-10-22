// 1. Перепишите функцию с использованием стрелочных функций, параметров по умолчанию и деструктуризации
const processUser = (user, options) => {
    const { name: displayName, email, role='user' } = user
    const { isActive = true, logs = [] } = options || {}

    logs.push('User processed at ' + new Date().toISOString());

    return {
        displayName,
        email,
        role,
        isActive,
        logs
    };
}

// 2. Перепишите функцию с использованием spread/rest и шаблонных строк
const combineArrays = (arr1, arr2) => {
    const result = [...arr1, ...arr2];

    console.log(`Arrays combined. Length: ${result.length}`);

    return result;
}

class Vehicle {
    constructor(brand, model, year) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.isRunning = false;
    }

    start(){
        this.isRunning = true;
        return this.brand + ' ' + this.model + ' has started.';
    }
    stop(){
        this.isRunning = false;
        return this.brand + ' ' + this.model + ' has stopped.';
    }
}

class Car extends Vehicle {
    constructor(brand, model, year, mileage) {
        super(brand, model, year);
        this.mileage = mileage || 0;
    }

    drive (distance) {
        this.mileage += distance;
        return 'Driving ' + distance + ' km. Total mileage: ' + this.mileage + ' km.';
    }
}

