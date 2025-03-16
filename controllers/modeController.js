const pool = require("../config/db");

// Get all modes for a customer
exports.getModesByCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    const query = "SELECT * FROM mode WHERE customer_id = ?";
    const [modes] = await pool.query(query, [customerId]);

    res.json(modes);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Add a new mode for a customer
exports.addMode = async (req, res) => {
  const { customer_id, name } = req.body;

  if (!customer_id || !name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO mode (customer_id, name)
      VALUES (?, ?)
    `;
    const [result] = await pool.query(query, [customer_id, name]);

    res.json({ message: "Mode added", modeId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
