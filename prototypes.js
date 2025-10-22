function Collection(){
    this.items = []
}

Collection.prototype.add = function(item){
    return this.items.push(item)
}

Collection.prototype.remove = function(item){
    return this.items.splice(this.items.indexOf(item), 1)
}

Collection.prototype.has = function(item){
    return this.items.indexOf(item) !== -1
}

Collection.prototype.clear = function(){
    return this.items = []
}

Collection.prototype.size = function(){
    return this.items.length
}

NumberCollection.prototype = Object.create(Collection.prototype);
NumberCollection.prototype.constructor = NumberCollection;

function NumberCollection(){
    Collection.call(this)
}

NumberCollection.prototype.sum = function (){
    return this.items.reduce((item,acc) => item + acc, 0);
}

NumberCollection.prototype.average = function (){
    const sum = this.sum();
    return sum / this.items.length
}

NumberCollection.prototype.max = function(){
    return Math.max(...this.items)
}

NumberCollection.prototype.min = function (){
    return Math.min(...this.items)
}

StringCollection.prototype = Object.create(Collection.prototype);
StringCollection.prototype.constructor = StringCollection

function StringCollection(){
    Collection.call(this)
}

StringCollection.prototype.join = function (separator){
    return this.items.join(separator)
}

StringCollection.prototype.totalLength = function (){
    return this.join('').length
}

StringCollection.prototype.getLongest = function (){
    let result = ''
    for (let i=0;i<this.items.length;i++){
        if (this.items[i].length > result.length) {
            result = this.items[i]
        }
    }
    return result
}

StringCollection.prototype.getShortest = function (){
    let result = ' '.repeat(100)
    for (let i=0;i<this.items.length;i++){
        if (this.items[i].length < result.length) {
            result = this.items[i]
        }
    }
    return result
}

const numbers = new NumberCollection();
numbers.add(5);
numbers.add(10);
numbers.add(3);
console.log(numbers.sum());     // 18
console.log(numbers.average()); // 6
console.log(numbers.has(10));   // true

const strings = new StringCollection();
strings.add("Привет");
strings.add("Мир");
strings.add("JavaScript");
console.log(strings.join(" ")); // "Привет Мир JavaScript"
console.log(strings.getShortest()); // "JavaScript"
console.log(strings.totalLength())