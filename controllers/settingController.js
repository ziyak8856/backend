const pool = require("../config/db");

// Get all settings for a customer
exports.getSettingsByCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    const query = "SELECT * FROM setting WHERE customer_id = ?";
    const [settings] = await pool.query(query, [customerId]);

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Add a new setting for a customer
exports.addSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Insert settings for each customer
    const settingQuery = "INSERT INTO setting (customer_id, name, table_name) VALUES ?";
    const settingValues = settings.map(({ customer_id, name, table_name }) => [
      customer_id,
      name,
      table_name
    ]);

    const [result] = await pool.query(settingQuery, [settingValues]);

    // Fetch the inserted settings with only id, name, and table_name
    const settingQuerySelect = "SELECT id,table_name FROM setting WHERE id >= ? AND id < ?";
    const [newSettings] = await pool.query(settingQuerySelect, [result.insertId, result.insertId + result.affectedRows]);
    for (const setting of newSettings) {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${setting.table_name}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Tunning_param VARCHAR(512) DEFAULT NULL
        )
      `;
      await pool.query(createTableQuery);
    }
    res.json({ message: "Settings added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

