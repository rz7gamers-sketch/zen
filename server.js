const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------ PATHS ------------------ */
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(__dirname, "uploads");

/* ------------------ STATIC ------------------ */
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOAD_DIR));

/* ------------------ ENSURE UPLOAD DIR ------------------ */
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ------------------ MULTER CONFIG ------------------ */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});

/* ------------------ ROUTES ------------------ */

// Upload selfie
app.post("/upload", upload.single("selfie"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  console.log("Selfie saved:", req.file.filename);
  res.json({ message: "Selfie received", file: req.file.filename });
});

// List selfies
app.get("/selfies", async (req, res) => {
  try {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    res.json(files);
  } catch (err) {
    console.error("Gallery error:", err);
    res.json([]);
  }
});

/* ------------------ START SERVER ------------------ */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
