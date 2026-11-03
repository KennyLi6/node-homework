const { userSchema } = require("../validation/userSchema");
const { Pool } = require("../db/pg-pool")

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
            details: error.details,
        });
    }
    let result = null;
    value.hashed_password = await hashPassword(value.password);
    // the code to here is like the in-memory version
    try {
        result = await pool.query(`INSERT INTO users (email, name, hashed_password)
            VALUES ($1, $2, $3) RETURNING id, email, name`,
            [value.email, value.name, value.hashed_password]
        ); // note that you use a parameterized query
    } catch (e) { // the email might already be registered
        if (e.code === "23505") { // this means the unique constraint for email was violated
            // here you return the 400 and the error message.  Use a return statement, so that 
            // you don't keep going in this function
            return res.status(400).json({
                message: "Email in use"
            })
        }
        return next(e); // all other errors get passed to the error handler
    }
    const user = result.rows[0];

    global.user_id = user.id;

    res.status(201).json({
        name: user.name,
        email: user.email,
    });
}

const logon = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length == 0) {
        res.status(401).json({
            message: "Couldn't log on"
        });
    }
    const user = result.rows[0]
    const goodCredentials = await comparePassword(password, user.hashedPassword);
    if (goodCredentials && email == user.email) {
        global.user_id = user.id;
        res.status(200).json({
            name: user.name,
            email: user.email,
        })
        return;
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