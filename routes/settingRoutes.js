const express = require("express");
const { getSettingsByCustomer, addSettings,addSetting,getTableName } = require("../controllers/settingController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:customerId", authMiddleware, getSettingsByCustomer);
router.post("/", authMiddleware, addSettings);
router.post("/add", authMiddleware, addSetting);
router.get("/getTableName/:settingId", authMiddleware, getTableName);

module.exports = router;
