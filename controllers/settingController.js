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
            serial_number INT NOT NULL,
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
          const insertQuery = `INSERT INTO \`${setting.table_name}\` (serial_number, Tunning_param) VALUES ?`;
          
          // Add serial numbers starting from 1
          const values = uniqueArray1.map((param, index) => [index + 1, param]);
    
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
  const connection = await pool.getConnection();
  try {
    const { customer_id, name, table_name } = req.body;

    if (!customer_id || !name || !table_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await connection.beginTransaction();

    //  Step 0: Lock customer and setting tables
    await connection.query(`LOCK TABLES customer WRITE, setting WRITE`);

    //  Step 1: Fetch mvvariables
    const [customerRows] = await connection.query(
      "SELECT mvvariables FROM customer WHERE id = ?",
      [customer_id]
    );

    if (customerRows.length === 0) {
      await connection.rollback();
      await connection.query("UNLOCK TABLES");
      return res.status(404).json({ message: "Customer not found" });
    }

    const originalMvvariables = customerRows[0].mvvariables;

    let uniqueArray1 = [];
    try {
      uniqueArray1 = JSON.parse(originalMvvariables);
    } catch (parseErr) {
      await connection.rollback();
      await connection.query("UNLOCK TABLES");
      console.error("Error parsing mvvariables JSON:", parseErr);
      return res.status(500).json({ message: "Invalid mvvariables format in customer table" });
    }

    //  Step 2: Insert into setting table
    const [result] = await connection.query(
      "INSERT INTO setting (customer_id, name, table_name) VALUES (?, ?, ?)",
      [customer_id, name, table_name]
    );

    const settingId = result.insertId;

    const [[newSetting]] = await connection.query(
      "SELECT id, name, table_name FROM setting WHERE id = ?",
      [settingId]
    );

    //  Step 3: Unlock before creating the new table
    await connection.query("UNLOCK TABLES");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`${newSetting.table_name}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        serial_number INT NOT NULL,
        Tunning_param VARCHAR(512) DEFAULT NULL
      )
    `;
    await connection.query(createTableQuery);

    //  Step 4: Re-lock customer and setting to re-check mvvariables
    await connection.query(`LOCK TABLES customer WRITE, setting WRITE`);

    const [recheckRows] = await connection.query(
      "SELECT mvvariables FROM customer WHERE id = ?",
      [customer_id]
    );

    const latestMvvariables = recheckRows[0]?.mvvariables;

    if (latestMvvariables !== originalMvvariables) {
      // Conflict detected, rollback and clean up
      await connection.query("UNLOCK TABLES");
      await connection.query(`DROP TABLE IF EXISTS \`${newSetting.table_name}\``);
      await connection.rollback();
      return res.status(409).json({ message: "Customer mvvariables changed during operation. Aborted." });
    }

    //  Step 5: Unlock to insert into the new setting table
    await connection.query("UNLOCK TABLES");

    //  Step 6: Lock the new table and insert default variables
    await connection.query(`LOCK TABLES \`${newSetting.table_name}\` WRITE`);

    if (uniqueArray1 && Array.isArray(uniqueArray1) && uniqueArray1.length > 0) {
      const insertQuery = `INSERT INTO \`${newSetting.table_name}\` (serial_number, Tunning_param) VALUES ?`;
      const values = uniqueArray1.map((param, index) => [index + 1, param]);
      await connection.query(insertQuery, [values]);
    }

    //  Step 7: Final unlock and commit
    await connection.query("UNLOCK TABLES");
    await connection.commit();

    res.json({ message: "Setting added successfully", setting: newSetting });

  } catch (err) {
    await connection.rollback();
    await connection.query("UNLOCK TABLES");
    console.error("Error in addSetting:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  } finally {
    connection.release();
  }
};
