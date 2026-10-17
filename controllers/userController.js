function register(req, res) {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

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
    res.status(401);
}

function logoff(req, res) {
    global.user_id = null;
    res.status(200);
}

module.exports = {
    register,
    logon,
    logoff,
}