const express = require('express');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ important for Railway

// Serve static files
app.use(express.static('public'));

// Ensure uploads folder exists
const uploadFolder = 'uploads';
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer setup for selfies
const storage = multer.diskStorage({
  destination: (req, file, cb) { cb(null, uploadFolder); },
  filename: (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// Selfie upload endpoint
app.post('/upload', upload.single('selfie'), (req, res) => {
  console.log('Selfie received:', req.file.path);
  res.json({ message: 'Selfie received!' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
