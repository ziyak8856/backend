const express = require("express");
const { addCustomers, getCustomersByProject, getCustomerById ,updateMVHeaderForCustomer} = require("../controllers/customerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Add a new customer under a project
router.post("/", authMiddleware, addCustomers);

// Get all customers under a specific project
// console.log("customer routes");
router.get("/:projectId",authMiddleware, getCustomersByProject);
router.get("/single/:customerId", getCustomerById);
router.post("/update-mv", updateMVHeaderForCustomer);

module.exports = router;
