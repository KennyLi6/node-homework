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
    res.status(200).json({ tasks: sanitizedTasks });
}

function show(req, res) {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Invalid format" });

}

exports.create = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Invalid format" });
    const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };
    global.tasks.push(newTask)
    const { userId, ...sanitizedTask } = newTask;
    res.status(201).json({ task: sanitizedTask })
}

function update(req, res) {
    
}

function deleteTask(req, res) {
    
}
