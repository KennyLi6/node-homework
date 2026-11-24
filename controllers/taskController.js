const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    if (page < 1) { return res.status(400).json({ message: "Invalid page number" }) }
    if (limit < 1 || limit > 100) { return res.status(400).json({ message: "Limit must be between 1 and 100" }) }


    const whereClause = { userId: req.user.id };

    if (req.query.find) {
        whereClause.title = {
            contains: req.query.find,
            mode: 'insensitive',
        };
    }

    const tasks = await prisma.task.findMany({
        where: whereClause,
        select: { 
            title: true,
            isCompleted: true, 
            id: true,
            priority: true,
            createdAt: true,
            User: {
                select: {
                    name: true,
                    email: true,
                }
            }
        },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
    });

    const totalTasks = await prisma.task.count({
        where: whereClause
    });

    const pages = Math.ceil(totalTasks/limit)
    const pagination = {
        page: page,
        limit: limit,
        total: totalTasks,
        pages: pages,
        hasNext: page < pages ? true : false,
        hasPrev: page > 1 ? true : false,
    }

    res.status(200).json({
        tasks: tasks, 
        pagination: pagination
    });
}

const show = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
            userId: req.user.id,
        },
        select: { 
            title: true, 
            isCompleted: true, 
            id: true, 
            User: true
        }
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
}

const create = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });
    // you do your Joi validation, and you have a validated task object. Then:
    
    try {
        const task = await prisma.task.create({
            data: { title: value.title, isCompleted: value.isCompleted, userId: req.user.id, priority: value.priority },
            select: { id: true, title: true , isCompleted: true, priority: true }
        });
        
        return res.status(201).json(task);
    } catch (err) {
        return next(err);
    }
}

const bulkCreate = async (req, res, next) => {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
            error: "Invalid request data"
        });
    }

    const validTasks = [];
    for (const task of tasks) {
        const { error, value } = taskSchema.validate(task);
        if (error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.details,
            });
        }
        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted || false,
            priority: value.priority || 'medium',
            userId: req.user.id
        });
    }

    try {
        const result = await prisma.task.createMany({
            data: validTasks,
            skipDuplicates: false
        });

        res.status(201).json({
            message: "Success",
            tasksCreated: result.count,
            totalRequested: validTasks.length
        })
    } catch (err) {
        return next(err);
    }
}

const update = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });

    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });

    try {
        const task = await prisma.task.update({
            data: value,
            where: {
                id: taskId,
                userId: req.user.id,
            },
            select: { title: true, isCompleted: true, id: true, priority: true }
        });
        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025" ) {
            return res.status(404).json({ message: "The task was not found."})
        } else {
            return next(err); // pass other errors to the global error handler
        }
    }
}

const deleteTask = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) return res.status(400).json({ message: "Invalid Id" });

    try {
        const task = await prisma.task.delete({
            where: {
                id: taskId,
                userId: req.user.id,
            },
            select: { title: true, isCompleted: true, id: true }
        });
        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025" ) {
            return res.status(404).json({ message: "The task was not found."})
        } else {
            return next(err); // pass other errors to the global error handler
        }
    }
}

module.exports = {
    index,
    show,
    create,
    bulkCreate,
    update,
    deleteTask
}