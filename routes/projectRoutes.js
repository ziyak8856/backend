const express = require("express");
const { createProject, getProjects } = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a new project with file uploads
router.post("/", authMiddleware, createProject);

// Get all projects
router.get("/", getProjects);

module.exports = router;
