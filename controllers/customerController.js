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
