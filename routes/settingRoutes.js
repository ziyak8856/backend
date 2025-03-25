const express = require("express");
const { getSettingsByCustomer, addSettings,addSetting } = require("../controllers/settingController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:customerId", authMiddleware, getSettingsByCustomer);
router.post("/", authMiddleware, addSettings);
router.post("/add", authMiddleware, addSetting);

module.exports = router;
