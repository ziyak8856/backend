const pool = require("../config/db");

// Add a new customer under a project
exports.addCustomers = async (req, res) => {
  try {
    const { projectId, customers, selectedIndexes } = req.body;
    console.log("customer routes", projectId, customers, selectedIndexes);

    if (!projectId || !customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const mergedGroups = [/* ... your MV4 and MV6 strings ... */
      "//$MV4[MCLK:[*MCLK*],mipi_phy_type:[*PHY_TYPE*],mipi_lane:[*PHY_LANE*],mipi_datarate:[*MIPI_DATA_RATE*]]",
    "//$MV4_CPHY_LRTE[enable:[*LRTE_EN*],longPacketSpace:2,shortPacketSpace:2]",
    "//$MV4_Scramble[enable:[*SCRAMBLE_EN*]]",
    "//$MV4_MainData[width:[*WIDTH*],height:[*HEIGHT*],data_type:[*DATA_TYPE*],virtual_channel:[*MAIN_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_IS_USED_LCG*],width:[*ILD_WIDTH_LCG*],height:[*ILD_HEIGHT_LCG*],data_type:[*DATA_TYPE*],virtual_channel:[*ILD_LCG_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_IS_USED1*],width:[*ILD_WIDTH1*],height:[*ILD_HEIGHT1*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD1_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_IS_USED2*],width:[*ILD_WIDTH2*],height:[*ILD_HEIGHT2*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD2_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_ELG_IS_USED3*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT3*],data_type:Embedded_Data (0x12),virtual_channel:[*ILD3_ELG_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_ELG_IS_USED4*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT4*],data_type:User_Defined_1 (0x30),virtual_channel:[*ILD4_ELG_VC*]]",
    "//$MV4_Start[]",
    "//$MV6[MCLK:[*MCLK*],mipi_phy_type:[*PHY_TYPE*],mipi_lane:[*PHY_LANE*],mipi_datarate:[*MIPI_DATA_RATE*]]",
    "//$MV6_CPHY_LRTE[enable:[*LRTE_EN*],longPacketSpace:2,shortPacketSpace:2]",
    "//$MV6_Scramble[enable:[*SCRAMBLE_EN*]]",
    "//$MV6_MainData[width:[*WIDTH*],height:[*HEIGHT*],data_type:[*DATA_TYPE*],virtual_channel:[*MAIN_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_IS_USED_LCG*],width:[*ILD_WIDTH_LCG*],height:[*ILD_HEIGHT_LCG*],data_type:[*DATA_TYPE*],virtual_channel:[*ILD_LCG_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_IS_USED1*],width:[*ILD_WIDTH1*],height:[*ILD_HEIGHT1*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD1_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_IS_USED2*],width:[*ILD_WIDTH2*],height:[*ILD_HEIGHT2*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD2_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_ELG_IS_USED3*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT3*],data_type:Embedded_Data (0x12),virtual_channel:[*ILD3_ELG_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_ELG_IS_USED4*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT4*],data_type:User_Defined_1 (0x30),virtual_channel:[*ILD4_ELG_VC*]]",
    "//$MV6_Start[]"
    ];

    const combinedMVText = selectedIndexes
      .map(i => mergedGroups[i])
      .join("\n");

    // Extract unique [*VAR*] placeholders
    const regex = /\[\*(.*?)\*\]/g;
    const uniqueVariables = new Set();
    let match;

    while ((match = regex.exec(combinedMVText)) !== null) {
      uniqueVariables.add(match[1]);
    }

    const uniqueArray = [...uniqueVariables];

    // Convert to needed formats
    const selectedmv = selectedIndexes.join(",");
   // const mvcnt = uniqueArray.length;
    const mvvariables = JSON.stringify(uniqueArray); // Save as JSON array

    // Insert multiple customers with selectedmv, mvcnt, mvvariables
    const query = "INSERT INTO customer (project_id, name, selectedmv, mvvariables) VALUES ?";
    const values = customers.map((customer) => [projectId, customer, selectedmv, mvvariables]);
    //ALTER TABLE customer ADD COLUMN mvvariables TEXT;
    //ALTER TABLE customer DROP COLUMN mvcnt;

    const [result] = await pool.query(query, [values]);

    // Fetch inserted customers
    const customerQuery = "SELECT id, name, selectedmv, mvvariables FROM customer WHERE id >= ? AND id < ?";
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
exports.updateMVHeaderForCustomer = async (req, res) => {
  const { customerId, selectedIndexes } = req.body;

  if (!customerId || !Array.isArray(selectedIndexes)) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  const connection = await pool.getConnection();
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  try {
    await connection.query("SET autocommit = 0");

    // Step 1: Fetch setting tables without locking
    const [settingResult] = await connection.query(
      'SELECT id, table_name FROM setting WHERE customer_id = ?',
      [customerId]
    );

    const settingIds = settingResult.map(row => row.id);
    const uniqueTableNames = [...new Set(settingResult.map(row => row.table_name))];

    // Step 2: Attempt to acquire all locks (retry if needed)
    const tablesToLock = [
      'customer WRITE',
      'setting WRITE',
      'setfile WRITE',
      ...uniqueTableNames.map(name => `\`${name}\` WRITE`)
    ].join(', ');

    let locked = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await connection.query(`LOCK TABLES ${tablesToLock}`);
        locked = true;
        break;
      } catch (lockErr) {
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        } else {
          throw new Error("Could not acquire table locks. Try again later.");
        }
      }
    }

    if (!locked) {
      throw new Error("Failed to lock required tables.");
    }

    // Step 3: Fetch customer data
    const [rows] = await connection.query(
      'SELECT selectedmv, mvvariables FROM customer WHERE id = ?',
      [customerId]
    );

    if (rows.length === 0) {
      await connection.query("UNLOCK TABLES");
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = rows[0];
    const storedIndexes = customer.selectedmv
      ? customer.selectedmv.split(',').map(i => parseInt(i.trim(), 10))
      : [];
    const mvvariables = customer.mvvariables
      ? JSON.parse(customer.mvvariables)
      : [];

    const add = selectedIndexes.filter(index => !storedIndexes.includes(index));
    const remove = storedIndexes.filter(index => !selectedIndexes.includes(index));

    let setfileRows = [];

    // ---------- Remove Phase ----------
    if (remove.length > 0 && settingIds.length > 0) {
      const [setfileResults] = await connection.query(
        'SELECT id, selectedmv FROM setfile WHERE setting_id IN (?)',
        [settingIds]
      );

      setfileRows = setfileResults;

      for (const setfile of setfileRows) {
        const originalIndexes = setfile.selectedmv
          ? setfile.selectedmv.split(',').map(i => parseInt(i.trim(), 10))
          : [];

        const filteredIndexes = originalIndexes.filter(index => !remove.includes(index));
        const updatedIndexes = [...new Set(filteredIndexes)].join(',');

        await connection.query(
          'UPDATE setfile SET selectedmv = ? WHERE id = ?',
          [updatedIndexes, setfile.id]
        );
      }
    }

    // ---------- Add Phase ----------
    if (add.length > 0) {
      const mergedGroups = ["//$MV4[MCLK:[*MCLK*],mipi_phy_type:[*PHY_TYPE*],mipi_lane:[*PHY_LANE*],mipi_datarate:[*MIPI_DATA_RATE*]]",
    "//$MV4_CPHY_LRTE[enable:[*LRTE_EN*],longPacketSpace:2,shortPacketSpace:2]",
    "//$MV4_Scramble[enable:[*SCRAMBLE_EN*]]",
    "//$MV4_MainData[width:[*WIDTH*],height:[*HEIGHT*],data_type:[*DATA_TYPE*],virtual_channel:[*MAIN_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_IS_USED_LCG*],width:[*ILD_WIDTH_LCG*],height:[*ILD_HEIGHT_LCG*],data_type:[*DATA_TYPE*],virtual_channel:[*ILD_LCG_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_IS_USED1*],width:[*ILD_WIDTH1*],height:[*ILD_HEIGHT1*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD1_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_IS_USED2*],width:[*ILD_WIDTH2*],height:[*ILD_HEIGHT2*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD2_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_ELG_IS_USED3*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT3*],data_type:Embedded_Data (0x12),virtual_channel:[*ILD3_ELG_VC*]]",
    "//$MV4_InterleavedData[isUsed:[*ILD_ELG_IS_USED4*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT4*],data_type:User_Defined_1 (0x30),virtual_channel:[*ILD4_ELG_VC*]]",
    "//$MV4_Start[]",
    "//$MV6[MCLK:[*MCLK*],mipi_phy_type:[*PHY_TYPE*],mipi_lane:[*PHY_LANE*],mipi_datarate:[*MIPI_DATA_RATE*]]",
    "//$MV6_CPHY_LRTE[enable:[*LRTE_EN*],longPacketSpace:2,shortPacketSpace:2]",
    "//$MV6_Scramble[enable:[*SCRAMBLE_EN*]]",
    "//$MV6_MainData[width:[*WIDTH*],height:[*HEIGHT*],data_type:[*DATA_TYPE*],virtual_channel:[*MAIN_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_IS_USED_LCG*],width:[*ILD_WIDTH_LCG*],height:[*ILD_HEIGHT_LCG*],data_type:[*DATA_TYPE*],virtual_channel:[*ILD_LCG_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_IS_USED1*],width:[*ILD_WIDTH1*],height:[*ILD_HEIGHT1*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD1_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_IS_USED2*],width:[*ILD_WIDTH2*],height:[*ILD_HEIGHT2*],data_type:MIPI_RAW10 (0x2B),virtual_channel:[*ILD2_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_ELG_IS_USED3*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT3*],data_type:Embedded_Data (0x12),virtual_channel:[*ILD3_ELG_VC*]]",
    "//$MV6_InterleavedData[isUsed:[*ILD_ELG_IS_USED4*],width:[*WIDTH*],height:[*ILD_ELG_HEIGHT4*],data_type:User_Defined_1 (0x30),virtual_channel:[*ILD4_ELG_VC*]]",
    "//$MV6_Start[]"];

      const combinedMVText = selectedIndexes.map(i => mergedGroups[i]).join("\n");
      const regex = /\[\*(.*?)\*\]/g;
      const uniqueVariablesFromMV = new Set();
      let match;

      while ((match = regex.exec(combinedMVText)) !== null) {
        uniqueVariablesFromMV.add(match[1]);
      }

      const missingVariables = [...uniqueVariablesFromMV].filter(
        variable => !mvvariables.includes(variable)
      );

      if (settingIds.length > 0) {
        const [setfileResults] = await connection.query(
          'SELECT id, selectedmv FROM setfile WHERE setting_id IN (?)',
          [settingIds]
        );

        setfileRows = setfileResults;

        for (const setfile of setfileRows) {
          const originalIndexes = setfile.selectedmv
            ? setfile.selectedmv.split(',').map(i => parseInt(i.trim(), 10))
            : [];

          const updatedIndexes = [...new Set([...originalIndexes, ...add])].join(',');

          await connection.query(
            'UPDATE setfile SET selectedmv = ? WHERE id = ?',
            [updatedIndexes, setfile.id]
          );
        }
      }

      // Insert missing variables into tuning tables
      if (missingVariables.length > 0) {
        const startSerial = mvvariables.length + 1;

        for (const tableName of uniqueTableNames) {
          await connection.query(
            `UPDATE ?? SET serial_number = serial_number + ? WHERE serial_number >= ? ORDER BY serial_number DESC`,
            [tableName, missingVariables.length, startSerial]
          );

          for (let i = 0; i < missingVariables.length; i++) {
            const serial_number = startSerial + i;
            const variable = missingVariables[i];

            await connection.query(
              `INSERT INTO ?? (serial_number, Tunning_param) VALUES (?, ?)`,
              [tableName, serial_number, variable]
            );
          }
        }

        const mergedSet = new Set([...uniqueVariablesFromMV, ...mvvariables]);
        const mergedUniqueArray = [...mergedSet];

        await connection.query(
          'UPDATE customer SET mvvariables = ? WHERE id = ?',
          [JSON.stringify(mergedUniqueArray), customerId]
        );
      }
    }

    // ---------- Final Update ----------
    const updatedCustomerSelectedMV = selectedIndexes.join(',');
    await connection.query(
      'UPDATE customer SET selectedmv = ? WHERE id = ?',
      [updatedCustomerSelectedMV, customerId]
    );

    await connection.query("COMMIT");
    await connection.query("UNLOCK TABLES");

    res.status(200).json({
      message: "MV header updated successfully.",
      storedVariableNames: mvvariables
    });

  } catch (error) {
    await connection.query("ROLLBACK");
    await connection.query("UNLOCK TABLES");
    console.error("Error updating MV header:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  } finally {
    connection.release();
  }
};
