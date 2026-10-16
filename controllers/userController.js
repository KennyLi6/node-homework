function register(req, res) {
    const email = req.body.email
    const name = req.body.name
    const password = req.body.name

    const user = 
    {
        email: email,
        name: name,
        password: password,
    }

    global.users.push(user)
    global.user_id = user

    res.status(201).json({
    name: name,
    email: email
  });
}

function logon(req, res) {
    
}

function logoff(req, res) {
    
}

module.exports = {
    register,
    logon,
    logoff,
}