const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

// Define upload directory
const UPLOAD_DIR = "C:\\Users\\DELL\\Desktop\\regmap";

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Create a new projectconst path = require("path");


exports.createProject = async (req, res) => {
  try {
    const { name, mv4, mv6 } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // Create a directory for the project
    const projectDir = path.join(UPLOAD_DIR, name);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    let regmapPath = "";
    let regmapBinPath = "";

    // Handle file uploads
    if (req.files && req.files.regmap) {
      const regmapFile = req.files.regmap;
      regmapPath = path.join(projectDir, regmapFile.name);
      await regmapFile.mv(regmapPath);
    }

    if (req.files && req.files.regmapBin) {
      const regmapBinFile = req.files.regmapBin;
      regmapBinPath = path.join(projectDir, regmapBinFile.name);
      await regmapBinFile.mv(regmapBinPath);
    }

    let start_fname = "A000";

    // Insert project into the database
    const query = `
      INSERT INTO project (name, mv4, mv6, regmap_path, regmap_binpath, start_fname)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [name, mv4, mv6, regmapPath, regmapBinPath, start_fname]);
    res.json({ 
      message: "Project created successfully", 
      projectId: result.insertId,
      projectName: name 
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};




exports.uploadRegmap = async (req, res) => {
  try {
    const { projectId, name } = req.body;
   
    if (!projectId || !name) {
      return res.status(400).json({ message: "Project ID and name are required" });
    }

    // **Step 1: Find the Project Folder**
    const projectDir = path.join(UPLOAD_DIR, name);
    //console.log(projectDir);
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ message: "Project directory not found" });
    }
    console.log(projectDir);
    // **Step 2: Remove Existing `.regmap.h` Files**
    const files = fs.readdirSync(projectDir);
    files.forEach((file) => {
      if (file.endsWith(".regmap.h.txt")) {
        fs.unlinkSync(path.join(projectDir, file));
      }
    });

    let regmapPath = "";

   // **Step 3: Save the New Regmap File**
    if (req.files && req.files.regmap) {
      const regmapFile = req.files.regmap;
      regmapPath = path.join(projectDir, regmapFile.name);
      await regmapFile.mv(regmapPath);
    } else {
      return res.status(400).json({ message: "No regmap file uploaded" });
    }
    console.log("r"+regmapPath);
    // **Step 4: Update Database**
    await pool.query(`UPDATE project SET regmap_path = ? WHERE id = ?`, [regmapPath, projectId]);

    res.json({
      message: "Regmap updated successfully",
      projectId: projectId,
      projectName: name,
      regmapPath: regmapPath,
    });

  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const [projects] = await pool.query("SELECT * FROM project");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
  }

  try {
      const query = `SELECT * FROM project WHERE id = ?`;
      const [rows] = await pool.query(query, [projectId]);

      if (rows.length === 0) {
          return res.status(404).json({ message: "Project not found" });
      }

      res.json(rows[0]); // Return the first project found
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ message: "Database error", error: err.message });
  }
};