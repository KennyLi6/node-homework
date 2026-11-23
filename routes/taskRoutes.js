const express = require("express");
const taskController = require("../controllers/taskController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();

router.use(jwtMiddleware);
router.get("/", taskController.index);
router.get("/:id", taskController.show);
router.post("/", taskController.create);
router.post("/bulk", taskController.bulkCreate);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask)

module.exports = router;