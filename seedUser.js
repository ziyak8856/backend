const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((er) => {
  if (err) return console.error("Database connection failed:", err);

  const email = "admin@example.com";
  const password = "admin123";
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
  db.query(sql, [email, hashedPassword], (err, result) => {
    if (err) console.error("Error inserting user:", err);
    else console.log("User inserted successfully:", result);
    db.end();
  });
});
