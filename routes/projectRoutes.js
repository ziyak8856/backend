const express = require("express");
const { createProject, getProjects, uploadRegmap } = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a new project with file uploads
router.post("/", authMiddleware, createProject);
router.post("/upload-regmap", authMiddleware, uploadRegmap);

// Get all projects
router.get("/", getProjects);

module.exports = router;
