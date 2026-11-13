const prisma = require("../db/prisma");

const getUserAnalytics = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID" });
    }

    const taskStats = await prisma.task.groupBy({
        by: ['isCompleted'],
        where: { userId },
        _count: {
            id: true
        }
    });

    const recentTasks = await prisma.task.findMany({
        where: { userId },
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true,
            userId: true,
            User: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
        by: ['createdAt'],
        where: {
            userId,
            createdAt: { gte: oneWeekAgo }
        },
        _count: { id: true }
    });

    res.status(200).json({
        taskStats,
        recentTasks,
        weeklyProgress
    })

    return;
}

const getUsersWithStats = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
        include: {
            Task: {
                where: { isCompleted: false },
                select: { id: true },
                take: 5
            },
            _count: {
                select: {
                    Task: true
                }
            }
        },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
    });

    const users = usersRaw.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        _count: user._count,
        Task: user.Task
    }));

    const totalUsers = await prisma.user.count();

    const pages = Math.ceil(totalUsers/limit)
    const pagination = {
        page: page,
        limit: limit,
        total: totalUsers,
        pages: pages,
        hasNext: page < pages ? true : false,
        hasPrev: page > 1 ? true : false,
    }

    res.status(200).json({
        users,
        pagination
    })
}

module.exports = {
    getUserAnalytics,
    getUsersWithStats,
}