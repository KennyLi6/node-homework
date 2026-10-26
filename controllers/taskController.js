const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

function index(req, res) {
    
}

function show(req, res) {
    
}

function create(req, res) {
    
}

function update(req, res) {
    
}

function deleteTask(req, res) {
    
}

module.exports = {
    index,
    show,
    create,
    update,
    deleteTask
}