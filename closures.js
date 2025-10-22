function createTaskManager(){
    let array = []
    return {
        addTask: function(task){
            array.push({id: array.length, task, completed: false})
            return array
        },
        getAllTasks: function () {
            for (let i = 0; i < array.length; i++) {
                console.log(array[i].task)
            }
            return array
        },
        removeTask: function(id){
            array = array.filter(task => task.id !== id)
            return array
        },
        getTask: function(id){
            const temp = array.find(task => task.id === id)
            if (temp) {
                console.log(temp.task)
            } else {
                console.log(`Задача номер ${id} не найдена`)
            }
        },
        getCompletedTasks: function (){
            for (let i = 0; i < array.length; i++) {
                if (array[i].completed) {
                    console.log(array[i].task)
                }
            }
        },
        markAsCompleted: function (id){
            array = array.map((item) => {
                if (item.id === id){
                    item.completed = true
                    return item
                }
                return item
            })
            return array
        }
    }
}

const taskManager = createTaskManager()
taskManager.addTask("Изучить замыкания")
taskManager.addTask("Подготовиться к ассессменту")
taskManager.removeTask(1)
taskManager.getCompletedTasks()
taskManager.markAsCompleted(0)
taskManager.getCompletedTasks()