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
exports.getTableName = async (req, res) => {
  try {
    const { settingId } = req.params;

    if (!settingId) {
      return res.status(400).json({ error: "Setting ID is required" });
    }

    const query = "SELECT table_name FROM setting WHERE id = ?";
    const [rows] = await pool.query(query, [settingId]); // Use `.promise()` for async/await

    if (rows.length === 0) {
      return res.status(404).json({ error: "Table name not found" });
    }

    res.json({ table_name: rows[0].table_name });
  } catch (error) {
    console.error("Error fetching table name:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Add a new setting for a customer
exports.addSettings = async (req, res) => {
  try {
    const { settings, uniqueArray1 } = req.body;
    console.log("uniqueArray1", uniqueArray1);
    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Insert settings into the database
    const settingQuery = "INSERT INTO setting (customer_id, name, table_name) VALUES ?";
    const settingValues = settings.map(({ customer_id, name, table_name }) => [
      customer_id,
      name,
      table_name
    ]);

    const [result] = await pool.query(settingQuery, [settingValues]);

    // Fetch the inserted settings with only id, name, and table_name
    const settingQuerySelect = "SELECT id, name, table_name FROM setting WHERE id >= ? AND id < ?";
    const [newSettings] = await pool.query(settingQuerySelect, [result.insertId, result.insertId + result.affectedRows]);

    // **First loop: Create all tables**
    for (const setting of newSettings) {
      try {
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS \`${setting.table_name}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            Tunning_param VARCHAR(512) DEFAULT NULL
          )
        `;
        await pool.query(createTableQuery);
      } catch (tableError) {
        console.error(`Error creating table ${setting.table_name}:`, tableError);
      }
    }

    // **Second loop: Insert values into tables**
    if (uniqueArray1 && Array.isArray(uniqueArray1) && uniqueArray1.length > 0) {
      for (const setting of newSettings) {
        try {
          const insertQuery = `INSERT INTO \`${setting.table_name}\` (Tunning_param) VALUES ?`;
          const values = uniqueArray1.map((param) => [param]); // Convert array for bulk insert
          await pool.query(insertQuery, [values]);
        } catch (insertError) {
          console.error(`Error inserting values into ${setting.table_name}:`, insertError);
        }
      }
    }

    res.json({ message: "Settings added successfully", settings: newSettings });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.addSetting = async (req, res) => {
  try {
    const { customer_id, name, table_name, uniqueArray1 } = req.body;
    console.log("uniqueArray1:", uniqueArray1);

    if (!customer_id || !name || !table_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // **Insert the setting into the database**
    const settingQuery = "INSERT INTO setting (customer_id, name, table_name) VALUES (?, ?, ?)";
    const [result] = await pool.query(settingQuery, [customer_id, name, table_name]);

    // Get the inserted setting with only id, name, and table_name
    const settingId = result.insertId;
    const settingQuerySelect = "SELECT id, name, table_name FROM setting WHERE id = ?";
    const [[newSetting]] = await pool.query(settingQuerySelect, [settingId]);

    // **Create the table for the new setting**
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${newSetting.table_name}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Tunning_param VARCHAR(512) DEFAULT NULL
        )
      `;
      await pool.query(createTableQuery);
    } catch (tableError) {
      console.error(`Error creating table ${newSetting.table_name}:`, tableError);
      return res.status(500).json({ message: `Error creating table ${newSetting.table_name}` });
    }

    // **Insert values into the new table**
    if (uniqueArray1 && Array.isArray(uniqueArray1) && uniqueArray1.length > 0) {
      try {
        const insertQuery = `INSERT INTO \`${newSetting.table_name}\` (Tunning_param) VALUES ?`;
        const values = uniqueArray1.map((param) => [param]); // Convert array for bulk insert
        await pool.query(insertQuery, [values]);
      } catch (insertError) {
        console.error(`Error inserting values into ${newSetting.table_name}:`, insertError);
        return res.status(500).json({ message: `Error inserting values into ${newSetting.table_name}` });
      }
    }

    res.json({ message: "Setting added successfully", setting: newSetting });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
 