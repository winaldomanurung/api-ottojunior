const express = require("express");
const router = express.Router();

const { transaction_controller } = require("../controllers");
const { auth } = require("../helpers/authToken");

router.get("/", auth, transaction_controller.getData);
router.get("/history", auth, transaction_controller.getTransactionHistory);
router.post("/topup", auth, transaction_controller.topUp);
router.get("/:billerId", auth, transaction_controller.confirmTransaction);

module.exports = router;
