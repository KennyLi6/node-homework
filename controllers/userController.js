const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

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
    value.hashed_password = await hashPassword(value.password);
    delete value.password;
    let user = null;
    try {
        user = await prisma.user.create({
            data: { name, email, hashedPassword },
            select: { name: true, email: true, id: true} // specify the column values to return
        });
    } catch (err) {
        if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
            // send the appropriate error back -- the email was already registered
            return res.status(400).json({ message: "Could not register" });
        } else {
            return next(err); // the error handler takes care of other errors
        }
    }
    
    global.user_id = user.id;

    res.status(201).json({
        name: user.name,
        email: user.email,
    });
}

const logon = async (req, res) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const user = await prisma.user.findUnique({ where: { email }});
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const goodCredentials = await comparePassword(password, user.hashed_password);
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