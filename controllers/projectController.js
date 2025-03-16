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

    res.json({ message: "Project created successfully", projectId: result.insertId });
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
