
class EventEmitter {
    constructor() {
        this.all = {
            once: {}
        }
    }

    on = (event, callback) => {
        if (event in this.all) {
            this.all[event].push(callback)
        } else {
            this.all[event] = [callback]
        }
    }

    off = (event, callback) => {
        if (event in this.all) {
            this.all[event] = this.all[event].filter((item) => item !== callback)
        }
    }
    emit = (event, data) => {
        if (event in this.all.once) {
            this.all.once[event](data)
            delete this.all.once[event]
            return
        }
        if (event in this.all) {
            this.all[event].forEach((fn) => {fn(data)})
        }
    }
    once = (event, callback) => {
        this.all.once[event] = callback
    }
}

const emitter = new EventEmitter();

const handler1 = (data) => console.log('Handler 1:', data);
const handler2 = (data) => console.log('Handler 2:', data);

emitter.on('message', handler1);
emitter.on('message', handler2);

emitter.emit('message', 'Hello');
// Handler 1: Hello
// Handler 2: Hello

emitter.off('message', handler1);
emitter.emit('message', 'World');
// Handler 2: World (только handler2)
//
emitter.once('single', (data) => console.log('Once:', data));
emitter.emit('single', 'First');  // Once: First
emitter.emit('single', 'Second'); // (ничего, уже отписался)