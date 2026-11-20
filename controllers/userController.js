const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    };
};

const setJwtCookie = (req, res, user) => {
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour
    return payload.csrfToken;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            content: value,
            details: error.details,
        });
    }
    value.hashedPassword = await hashPassword(value.password);
    delete value.password;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { email: value.email, name: value.name, hashedPassword: value.hashedPassword },
                select: { id: true, email: true, name: true }
            });

            const welcomeTaskData = [
                { title: "Complete your profile", userId: newUser.id, priority: "medium" },
                { title: "Add your first task", userId: newUser.id, priority: "high" },
                { title: "Explore the app", userId: newUser.id, priority: "low" }
            ];
            await tx.task.createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: { in: welcomeTaskData.map(t => t.title) }
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true
                }
            });

            return { user: newUser, welcomeTasks };
        });

        global.user_id = result.user.id; 

        return res.status(201).json({
            user: result.user,
            welcomeTasks: result.welcomeTasks,
            transactionStatus: "success"
        }); 
    } catch (err) {
        if (err.code === "P2002") {
            // send the appropriate error back -- the email was already registered
            return res.status(400).json({ message: "Email already registered" });
        } else {
            return next(err); // the error handler takes care of other errors
        }
    }
}

const logon = async (req, res) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const user = await prisma.user.findUnique({ 
        where: { email: email },
        select: {
            id: true,
            name: true,
            email: true,
            hashedPassword: true
        }
    });
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const goodCredentials = await comparePassword(password, user.hashedPassword);
    if (goodCredentials && email == user.email) {
        global.user_id = user.id;
        return res.status(200).json({
            name: user.name,
            email: user.email,
        })
    }
    res.status(401).json({
        message: "Couldn't log on"
    });
}

function logoff(req, res) {
    global.user_id = null;
    res.status(200).json({
        message: "Log off success"
    });
}

module.exports = {
    register,
    logon,
    logoff,
}