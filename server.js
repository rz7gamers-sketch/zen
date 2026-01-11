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

// At the very top, after other requires
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let client;
let db;

// Connect once on startup
(async () => {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(); // uses the DB name from URI or default
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
})();

// Routes (add/replace these)
app.get('/diary', async (req, res) => {
  try {
    const entries = await db.collection('diary').find().sort({ _id: -1 }).toArray(); // newest first
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load diary' });
  }
});

app.post('/diary', async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Please write something sweet...' });
  }

  const entry = {
    content: content.trim(),
    date: new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    createdAt: new Date() // for sorting
  };

  try {
    await db.collection('diary').insertOne(entry);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

// Optional: Graceful shutdown (good practice)
process.on('SIGTERM', async () => {
  if (client) await client.close();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});