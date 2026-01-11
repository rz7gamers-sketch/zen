const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Important: Add these two lines so POST body is parsed correctly
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary config (your existing part)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zenith-selfies',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

const upload = multer({ storage });

// Serve static files
app.use(express.static(__dirname));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload route
app.post('/upload', upload.single('selfie'), (req, res) => {
  if (req.file) {
    res.sendStatus(200);
  } else {
    res.status(400).send('Upload failed');
  }
});

// Selfies list
app.get('/selfies', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'zenith-selfies/',
      max_results: 100
    });
    const urls = result.resources.map(r => r.secure_url);
    res.json(urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch selfies' });
  }
});

// ────────────────────────────────────────────────
// MongoDB Diary Part – FIXED
// ────────────────────────────────────────────────

let db;

(async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(); // uses DB name from connection string
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  }
})();

app.get('/diary', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not ready' });

  try {
    const entries = await db.collection('diary').find().sort({ createdAt: -1 }).toArray();
    res.json(entries);
  } catch (err) {
    console.error('Diary fetch error:', err);
    res.status(500).json({ error: 'Failed to load entries' });
  }
});

app.post('/diary', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not ready' });

  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content required' });
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
    createdAt: new Date()
  };

  try {
    await db.collection('diary').insertOne(entry);
    res.json({ success: true });
  } catch (err) {
    console.error('Diary save error:', err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});