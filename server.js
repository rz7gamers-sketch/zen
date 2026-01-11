const express = require('express');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadFolder); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// Endpoint for selfie upload
app.post('/upload', upload.single('selfie'), (req, res) => {
  console.log('Selfie received:', req.file.path);
  res.json({ message: 'Selfie received!' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Endpoint to send list of uploaded selfies
app.get('/selfies', (req, res) => {
    const files = fs.readdirSync(uploadFolder);
    res.json(files); // send array of filenames
});


// Serve uploads folder so images can be viewed
app.use('/uploads', express.static(uploadFolder));

