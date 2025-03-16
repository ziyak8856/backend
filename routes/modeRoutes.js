const express = require("express");
const { getModesByCustomer, addMode } = require("../controllers/modeController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:customerId", authMiddleware, getModesByCustomer);
router.post("/", authMiddleware, addMode);

module.exports = router;
