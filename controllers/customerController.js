const pool = require("../config/db");

// Add a new customer under a project
exports.addCustomers = async (req, res) => {
  try {
    const { projectId, customers, selectedIndexes } = req.body;
    console.log("customer routes", projectId, customers, selectedIndexes);
    if (!projectId || !customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Convert selectedIndexes to a comma-separated string
    const selectedmv = selectedIndexes.join(",");

    // Insert multiple customers along with selectedmv data
    const query = "INSERT INTO customer (project_id, name, selectedmv,mvcnt) VALUES ?";
    const values = customers.map((customer) => [projectId, customer, selectedmv,selectedIndexes.length]);

    const [result] = await pool.query(query, [values]);

    // Fetch the inserted customer data with only id, name, and selectedmv
    const customerQuery = "SELECT id, name, selectedmv FROM customer WHERE id >= ? AND id < ?";
    const [newCustomers] = await pool.query(customerQuery, [result.insertId, result.insertId + result.affectedRows]);

    res.json({ message: "Customers added successfully", customers: newCustomers });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};




// Get all customers under a specific project
exports.getCustomersByProject = async (req, res) => {
  try {
   // console.log("customer routes");
    const { projectId } = req.params;
   // console.log(projectId);
    const [customers] = await pool.query("SELECT * FROM customer WHERE project_id = ?", [projectId]);
   // console.log(customers);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
exports.getCustomerById = async (req, res) => {
  try {
    console.log("customer routes");
    const { customerId } = req.params;
    console.log(customerId);
    const [customer] = await pool.query("SELECT * FROM customer WHERE id = ?", [customerId]);

    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    console.log(customer)
    res.json(customer[0]);
  } catch (err) {
    console.error("Error fetching customer:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
