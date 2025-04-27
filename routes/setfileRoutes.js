const express = require("express");
const { getSetFiles,getTableData,addRow,updateRow,deleteRow ,markFileAsDeleted} = require("../controllers/setfileController");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");


// Route to fetch setfiles by mode_id
router.get("/getSetFiles", authMiddleware,getSetFiles);
router.post("/get-table-data", authMiddleware,getTableData);
router.post("/add-row", authMiddleware,addRow);
router.post("/update-row", authMiddleware,updateRow);
router.post("/delete-row", authMiddleware,deleteRow); 
router.post("/mark-deleted",authMiddleware,markFileAsDeleted)
module.exports = router;
