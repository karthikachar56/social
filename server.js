const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_secret_key_2024';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventhub';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

mongoose.connect(MONGO_URI)
  .then(() => { console.log('Connected to MongoDB'); seedAdmins(); })
  .catch(err => console.error('MongoDB error:', err));

// --- SCHEMAS ---

const AdminSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  avatar:    { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Admin = mongoose.model('Admin', AdminSchema);

const EventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  date:        { type: String, required: true },
  time:        { type: String, default: '' },
  location:    { type: String, default: '' },
  category:    { type: String, default: 'General' },
  image:       { type: String, default: '' },
  tags:        [String],
  likes:       { type: Number, default: 0 },
  adminName:   { type: String, required: true },
  adminId:     { type: String, required: true },
  createdAt:   { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', EventSchema);

const NewsSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  summary:   { type: String, default: '' },
  category:  { type: String, default: 'General' },
  image:     { type: String, default: '' },
  tags:      [String],
  likes:     { type: Number, default: 0 },
  adminName: { type: String, required: true },
  adminId:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const News = mongoose.model('News', NewsSchema);

// --- AUTH MIDDLEWARE ---
const authAdmin = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// --- FILE UPLOAD ---
app.post('/api/upload', authAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided or invalid type.' });
  const url = '/uploads/' + req.file.filename;
  res.json({ url });
});

// --- ADMIN AUTH ---
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(400).json({ error: 'No admin found with that email.' });
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(400).json({ error: 'Incorrect password.' });
    const token = jwt.sign({ id: admin._id, email: admin.email, name: admin.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, avatar: admin.avatar } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/admin/me', authAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    res.json(admin);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all admins (for display)
app.get('/api/admins', authAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

// --- EVENTS ---
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/events', authAdmin, async (req, res) => {
  try {
    const { title, description, date, time, location, category, image, tags } = req.body;
    if (!title || !description || !date) return res.status(400).json({ error: 'Title, description and date are required.' });
    const ev = new Event({ title, description, date, time, location, category, image, tags: tags || [], adminName: req.admin.name, adminId: req.admin.id });
    await ev.save();
    res.status(201).json(ev);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/api/events/:id', authAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ev) return res.status(404).json({ error: 'Event not found.' });
    res.json(ev);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/api/events/:id', authAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndDelete(req.params.id);
    if (!ev) return res.status(404).json({ error: 'Event not found.' });
    res.json({ message: 'Event deleted.' });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/events/:id/like', async (req, res) => {
  try {
    const { action } = req.body; // 'like' or 'unlike'
    const inc = action === 'unlike' ? -1 : 1;
    const ev = await Event.findByIdAndUpdate(req.params.id, { $inc: { likes: inc } }, { new: true });
    if (!ev) return res.status(404).json({ error: 'Event not found.' });
    res.json({ likes: ev.likes });
  } catch { res.status(500).json({ error: 'Server error.' }); }
});

// --- NEWS ---
app.get('/api/news', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/news', authAdmin, async (req, res) => {
  try {
    const { title, content, summary, category, image, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });
    const news = new News({ title, content, summary, category, image, tags: tags || [], adminName: req.admin.name, adminId: req.admin.id });
    await news.save();
    res.status(201).json(news);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/api/news/:id', authAdmin, async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!news) return res.status(404).json({ error: 'News not found.' });
    res.json(news);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/api/news/:id', authAdmin, async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found.' });
    res.json({ message: 'News deleted.' });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/news/:id/like', async (req, res) => {
  try {
    const { action } = req.body;
    const inc = action === 'unlike' ? -1 : 1;
    const news = await News.findByIdAndUpdate(req.params.id, { $inc: { likes: inc } }, { new: true });
    if (!news) return res.status(404).json({ error: 'News not found.' });
    res.json({ likes: news.likes });
  } catch { res.status(500).json({ error: 'Server error.' }); }
});

// Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- SEED 6 ADMINS ---
async function seedAdmins() {
  const admins = [
    { name: 'Alex Johnson',   email: 'alex@eventhub.com',  password: 'admin123' },
    { name: 'Sarah Williams', email: 'sarah@eventhub.com', password: 'admin123' },
    { name: 'Mike Chen',      email: 'mike@eventhub.com',  password: 'admin123' },
    { name: 'Emma Davis',     email: 'emma@eventhub.com',  password: 'admin123' },
    { name: 'James Brown',    email: 'james@eventhub.com', password: 'admin123' },
    { name: 'Priya Patel',    email: 'priya@eventhub.com', password: 'admin123' },
  ];
  for (const a of admins) {
    const exists = await Admin.findOne({ email: a.email });
    if (!exists) {
      const hashed = await bcrypt.hash(a.password, 10);
      await new Admin({ name: a.name, email: a.email, password: hashed }).save();
      console.log(`Seeded admin: ${a.email}`);
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`EventHub running → http://localhost:${PORT}`));
}

module.exports = app;
