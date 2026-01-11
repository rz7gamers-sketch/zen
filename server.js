const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zenith-selfies', // All uploads go into this folder on Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'] // Restrict to images
  }
});

const upload = multer({ storage });

// Serve static files (e.g., her-image.jpeg)
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('selfie'), (req, res) => {
  if (req.file) {
    // File uploaded successfully to Cloudinary
    res.sendStatus(200);
  } else {
    res.status(400).send('Upload failed');
  }
});

// Get list of selfie URLs
app.get('/selfies', (req, res) => {
  cloudinary.api.resources({
    type: 'upload',
    prefix: 'zenith-selfies/', // Fetch only from this folder
    max_results: 100 // Adjust if you expect more
  })
  .then(result => {
    const urls = result.resources.map(resource => resource.secure_url);
    res.json(urls);
  })
  .catch(error => {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch selfies' });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});