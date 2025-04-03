const express = require("express");
const { getSetFiles,getTableData } = require("../controllers/setfileController");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");


// Route to fetch setfiles by mode_id
router.get("/getSetFiles", authMiddleware,getSetFiles);
router.post("/get-table-data", authMiddleware,getTableData);

module.exports = router;
