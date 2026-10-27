const { userSchema } = require("../validation/userSchema");

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

const register = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });

    const email = value.email;
    const name = value.name;
    const hashedPassword = await hashPassword(value.password);

    const user = 
    {
        email: email,
        name: name,
        hashedPassword: hashedPassword,
    }

    global.users.push(user);
    global.user_id = user;

    res.status(201).json({
        name: name,
        email: email,
    });
}

const logon = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    for (let user of global.users) {

        const goodCredentials = await comparePassword(password, user.hashedPassword);
        if (goodCredentials && email == user.email) {
            global.user_id = user;
            res.status(200).json({
                name: user.name,
                email: user.email,
            })
            return;
        }
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