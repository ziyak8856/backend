const express = require("express");
const { createProject, getProjects, uploadRegmap,getProjectById,getRegmap } = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a new project with file uploads
router.post("/", authMiddleware, createProject);
router.post("/upload-regmap", authMiddleware, uploadRegmap);
router.get("/:projectId",authMiddleware, getProjectById);
router.get("/regmap/:projectId",authMiddleware, getRegmap);

// Get all projects
router.get("/", getProjects);

module.exports = router;
