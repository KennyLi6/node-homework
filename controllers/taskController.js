const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

const index = async (req, res) => {
    const tasks = await prisma.task.findMany({
        where: {
            userId: global.user_id, // only the tasks for this user!
        },
        select: { title: true, isCompleted: true, id: true }
    });
    if (tasks.length == 0) {
        return res.status(404).json({ message: "No tasks found" });
    }
    res.status(200).json(tasks);
}

const show = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
            userId: global.user_id,
        },
        select: { title: true, isCompleted: true, id: true }
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
}

const create = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });
    // you do your Joi validation, and you have a validated task object. Then:
    let task = null;
    try {
        task = await prisma.task.create({
            data: { title: value.title, isCompleted: value.isCompleted, userId: global.user_id },
            select: { id: true, title: true , isCompleted: true }
        });
    } catch (err) {
        return next(err);
    }
    res.status(201).json(task);
}

const update = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });

    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });

    let task = null;
    try {
        task = await prisma.task.update({
            data: value,
            where: {
                id: taskId,
                userId: global.user_id,
            },
            select: { title: true, isCompleted: true, id: true }
        });
    } catch (err) {
        if (err.code === "P2025" ) {
            return res.status(404).json({ message: "The task was not found."})
        } else {
            return next(err); // pass other errors to the global error handler
        }
    }
    res.status(200).json(task);
}

const deleteTask = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });
    let task = null;
    try {
        task = await prisma.task.delete({
            where: {
                id: taskId,
                userId: global.user_id,
            },
            select: { title: true, isCompleted: true, id: true }
        });
    } catch (err) {
        if (err.code === "P2025" ) {
            return res.status(404).json({ message: "The task was not found."})
        } else {
            return next(err); // pass other errors to the global error handler
        }
    }
    res.status(200).json(task);
}

module.exports = {
    index,
    show,
    create,
    update,
    deleteTask
}