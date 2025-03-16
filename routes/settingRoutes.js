const express = require("express");
const { getSettingsByCustomer, addSettings } = require("../controllers/settingController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:customerId", authMiddleware, getSettingsByCustomer);
router.post("/", authMiddleware, addSettings);

module.exports = router;
