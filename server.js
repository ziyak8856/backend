const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const customerRoutes = require("./routes/customerRoutes");
const modeRoutes = require("./routes/modeRoutes");
const settingRoutes = require("./routes/settingRoutes");
const setfileRoutes = require("./routes/setfileRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Serve uploaded files statically
app.use("/uploads", express.static("C:\\Users\\DELL\\Desktop\\regmap"));

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/customers", customerRoutes);
app.use("/modes", modeRoutes);
app.use("/settings", settingRoutes);
app.use("/setfile", setfileRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
