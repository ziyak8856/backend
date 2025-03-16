const express = require("express");
const { addCustomers, getCustomersByProject } = require("../controllers/customerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Add a new customer under a project
router.post("/", authMiddleware, addCustomers);

// Get all customers under a specific project
// console.log("customer routes");
router.get("/:projectId",authMiddleware, getCustomersByProject);

module.exports = router;
