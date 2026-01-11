const express = require('express');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Ensure uploads folder exists
const uploadFolder = 'uploads';
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Setup Multer for selfies
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// POST endpoint to receive selfies
app.post('/upload', upload.single('selfie'), (req, res) => {
  console.log('Selfie received:', req.file.path);
  res.json({ message: 'Selfie received!' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
