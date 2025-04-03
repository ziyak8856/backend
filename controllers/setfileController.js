const pool = require("../config/db");

// Fetch all setfiles for a given mode_id
exports.getSetFiles = async (req, res) => {
  const { mode_id } = req.query;

  if (!mode_id) {
    return res.status(400).json({ message: "mode_id is required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, mode_id, setting_id, name, full_name, created_at FROM setfile WHERE mode_id = ?",
      [mode_id]
    );

    if (rows.length > 0) {
      res.json({ files: rows }); // Send full data but only print names in frontend
    } else {
      res.status(404).json({ message: "No files found for this mode" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
 // Ensure the database connection pool is imported

exports.getTableData = async (req, res) => {
  const { tableName, columnName } = req.body; // Extract from request body

  console.log("Received request for table:", tableName);
  console.log("Received request for column:", columnName);

  if (!tableName || !columnName) {
    return res.status(400).json({ error: "Missing table name or column name" });
  }

  try {
    const query = `SELECT id, Tunning_param, \`${columnName}\` FROM \`${tableName}\``; // Use backticks to prevent SQL syntax issues
    const [rows] = await pool.query(query); // Use `.query()` for better safety

    res.json({ columnName, rows });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Database query failed" });
  }
};
