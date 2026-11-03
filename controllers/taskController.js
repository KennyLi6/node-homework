const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { pool } = require("../db/pg-pool");

const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

exports.index = async (req, res) => {
    const result = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
        [global.user_id]);
    const tasks = result.rows;
    if (tasks.length == 0) {
        return res.status(404).json({ message: "No tasks found" });
    }
    res.status(200).json(tasks);
}

exports.show = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });
    const task = global.tasks.find(
        (task) => task.userId === global.user_id.email && task.id === taskId,
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    const { userId, ...sanitizedTask } = task;
    res.status(200).json(sanitizedTask);
}

exports.create = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });
    // you do your Joi validation, and you have a validated task object. Then:
    const result = await pool.query(`INSERT INTO tasks (title, is_completed, user_id)
        VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
        [value.title, value.isCompleted, global.user_id]);
    const task = result.rows[0];
    // You don't need a try/catch because the global error handler will handle the errors
    res.status(201).json(task);
}

exports.update = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });
    const taskId = parseInt(req.params?.id);
    const task = global.tasks.find(
        (task) => task.userId === global.user_id.email && task.id === taskId,
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    Object.assign(task, value);
    const { userId, ...sanitizedTask } = task;
    res.status(200).json(sanitizedTask);
}

exports.deleteTask = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });
    const index = global.tasks.findIndex(
        (t) => t.userId === global.user_id.email && t.id === taskId
    );
    if (index === -1) return res.status(404).json({ message: "Task not found" });
    const [task] = global.tasks.splice(index, 1);
    const { userId, ...sanitizedTask } = task;
    res.status(200).json(sanitizedTask);
}
