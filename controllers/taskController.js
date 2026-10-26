const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

exports.index = async (req, res) => {
    const userTasks = global.tasks.filter(
        (task) => task.userId === global.user_id.email,
    );
    if (userTasks.length == 0) {
        return res.status(404).json({ message: "No tasks found" });
    }
    const sanitizedTasks = userTasks.map(task => { 
        const {userId, ...sanitizedTask} = task;
        return sanitizedTask
    });
    res.status(200).json({ sanitizedTasks });
}

function show(req, res) {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });
    const task = global.tasks.filter(
        (task) => task.userId === global.user_id.email && task.id === taskId,
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    const { userId, ...sanitizedTask } = task;
    res.status(200).json({ sanitizedTask });
}

exports.create = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Invalid format" });
    const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };
    global.tasks.push(newTask)
    const { userId, ...sanitizedTask } = newTask;
    res.status(201).json({ sanitizedTask })
}

function update(req, res) {
    
}

function deleteTask(req, res) {
    
}
