const { userSchema } = require("../validation/userSchema");

exports.register = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: "Invalid format" });

    const email = value.email;
    const name = value.name;
    const password = value.password;

    const user = 
    {
        email: email,
        name: name,
        password: password,
    }

    global.users.push(user);
    global.user_id = user;

    res.status(201).json({
        name: name,
        email: email,
    });
}

function logon(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    for (let user of global.users) {
        if (user.email == email && user.password == password) {
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
    logon,
    logoff,
}