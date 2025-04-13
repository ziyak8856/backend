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
    const query = `
      SELECT id, serial_number, Tunning_param, \`${columnName}\` 
      FROM \`${tableName}\` 
      ORDER BY serial_number ASC
    `;

    const [rows] = await pool.query(query);
    // console.log("Fetched rows:", rows); 
    res.json({ columnName, rows });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Database query failed" });
  }
};
exports.addRow = async (req, res) => {
  const { tableName, referenceId, position, rowData, defaultValue } = req.body;
   console.log("Received request to add row:", req.body);
  try {
    // Step 1: Fetch serial_number of the reference row
    const [refRow] = await pool.query(
      `SELECT serial_number FROM \`${tableName}\` WHERE id = ?`,
      [referenceId]
    );
    if (refRow.length === 0) {
      return res.status(404).json({ error: "Reference row not found" });
    }

    // Step 2: Calculate new serial number
    let newSerial = refRow[0].serial_number ;

    // Step 3: Shift serial_numbers to make space
    await pool.query(
      `UPDATE \`${tableName}\` SET serial_number = serial_number + 1 WHERE serial_number >= ?`,
      [newSerial]
    );

    // Step 4: Fetch full column list from the table
    const [columnsInfo] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const allColumns = columnsInfo.map(col => col.Field);

    // Step 5: Prepare full row using rowData + defaultValue
    const newRow = {};
    for (const col of allColumns) {
      if (col === 'id' || col === 'serial_number') continue;
      newRow[col] = rowData[col] !== undefined ? rowData[col] : defaultValue;
    }

    // Step 6: Generate insert query
    const insertCols = Object.keys(newRow).map(col => `\`${col}\``).join(", ");
    const insertVals = Object.values(newRow);
    const placeholders = insertVals.map(() => "?").join(", ");

    const [insertResult] = await pool.query(
      `INSERT INTO \`${tableName}\` (${insertCols}, serial_number) VALUES (${placeholders}, ?)`,
      [...insertVals, newSerial]
    );

    // Step 7: Fetch and return the inserted row
    const [newRowData] = await pool.query(
      `SELECT * FROM \`${tableName}\` WHERE id = ?`,
      [insertResult.insertId]
    );

    res.json({ success: true, newRow: newRowData[0] });

  } catch (error) {
    console.error("Add row error:", error);
    res.status(500).json({ error: "Failed to add row" });
  }
};

exports.updateRow = async (req, res) => {
  const { tableName, id, columnName, value, regmapEntry } = req.body;
  console.log("Received request to update row:", req.body);

  try {
    // Case: Tunning_param + regmapEntry means update all other relevant columns too
    if (columnName === "Tunning_param" && regmapEntry !== undefined) {
      const [columnsResult] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
      const allColumns = columnsResult.map(col => col.Field);

      // Exclude non-editable columns
      const columnsToUpdate = allColumns.filter(col =>
        !["id", "serial_number", "Tunning_param"].includes(col)
      );

      // Construct SET clause
      const updateFields = ["`Tunning_param` = ?"];
      const updateValues = [value];

      for (const col of columnsToUpdate) {
        updateFields.push(`\`${col}\` = ?`);
        updateValues.push(regmapEntry);
      }

      updateValues.push(id); // WHERE id = ?

      const [updateResult] = await pool.query(
        `UPDATE \`${tableName}\` SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Row not found" });
      }

      return res.json({ success: true, updatedAll: true });
    }

    // Fallback: just update the one column normally
    const [updateResult] = await pool.query(
      `UPDATE \`${tableName}\` SET \`${columnName}\` = ? WHERE id = ?`,
      [value, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Row not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Update row error:", error);
    return res.status(500).json({ error: "Failed to update row" });
  }
};
