const express = require("express");
const router = express.Router();

const { user_controller } = require("../controllers");
const { auth } = require("../helpers/authToken");

router.post("/register", user_controller.register);
router.post("/login", user_controller.login);
router.get("/data", auth, user_controller.getUserData);
router.get("/balance", auth, user_controller.getBalance);

module.exports = router;
