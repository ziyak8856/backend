const pool = require("../config/db");

// Add a new customer under a project
exports.addCustomers = async (req, res) => {
  try {
    const { projectId, customers } = req.body;

    if (!projectId || !customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // console.log(customers);

    // Insert multiple customers
    const query = "INSERT INTO customer (project_id, name) VALUES ?";
    const values = customers.map((customer) => [projectId, customer]);

    const [result] = await pool.query(query, [values]);

    // Fetch the inserted customer data with only id and name
    const customerQuery = "SELECT id, name FROM customer WHERE id >= ? AND id < ?";
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
