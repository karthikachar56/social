const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'instavibe_fallback_secret_key';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instavibe';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    seedDatabase();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// --- MODELS ---

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  bio: { type: String, default: 'Living the absolute best life. Built with Tailwind, AlpineJS & Express!' },
  followers: { type: String, default: '0' },
  following: { type: String, default: '0' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.model('User', UserSchema);

// Post Schema
const PostSchema = new mongoose.Schema({
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  location: { type: String, default: '' },
  image: { type: String, required: true },
  likes: [{ type: String }], // Array of usernames who liked it
  caption: { type: String, default: '' },
  comments: [{
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', PostSchema);

// Message Schema
const MessageSchema = new mongoose.Schema({
  senderUsername: { type: String, required: true },
  receiverUsername: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// --- AUTH MIDDLEWARE ---
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden. Invalid session token.' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
};

// --- AUTH ENDPOINTS ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Derive username from email prefix
    let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    let username = baseUsername;
    let suffix = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}_${suffix}`;
      suffix++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      username,
      name,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      role: 'user' // Locked to user registration on signup
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!', username });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Find by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        fullName: user.name,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        followers: user.followers,
        following: user.following
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Get profile details
app.get('/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      username: user.username,
      fullName: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      followers: user.followers,
      following: user.following
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- POST ENDPOINTS ---

// Fetch feed posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// Create Post (Admin only)
app.post('/api/posts', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Admins only.' });
    }

    const { image, caption, location } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image URL is required.' });
    }

    const user = await User.findById(req.user.id);

    const newPost = new Post({
      username: user.username,
      avatar: user.avatar,
      verified: true,
      location: location || 'San Francisco, CA',
      image,
      caption: caption || '',
      likes: [],
      comments: []
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// Like / Unlike Post
app.post('/api/posts/:id/like', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const index = post.likes.indexOf(req.user.username);
    if (index > -1) {
      post.likes.splice(index, 1); // Unlike
    } else {
      post.likes.push(req.user.username); // Like
    }

    await post.save();
    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// Comment on Post
app.post('/api/posts/:id/comment', authenticateJWT, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    post.comments.push({
      user: req.user.username,
      text: text.trim(),
      createdAt: new Date()
    });

    await post.save();
    res.status(201).json(post.comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// --- CHAT ENDPOINTS ---

// Fetch conversation messages
app.get('/api/chats/:receiverUsername', authenticateJWT, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderUsername: req.user.username, receiverUsername: req.params.receiverUsername },
        { senderUsername: req.params.receiverUsername, receiverUsername: req.user.username }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Send message (with simulation of automated bot replies for mock users)
app.post('/api/chats/message', authenticateJWT, async (req, res) => {
  try {
    const { receiverUsername, text } = req.body;
    if (!receiverUsername || !text || !text.trim()) {
      return res.status(400).json({ error: 'Receiver username and message text are required.' });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Store sender message
    const newMessage = new Message({
      senderUsername: req.user.username,
      receiverUsername,
      text: text.trim(),
      time: timeStr
    });
    await newMessage.save();

    res.status(201).json(newMessage);

    // Simulated Auto-Reply for default mock accounts
    const mockAccounts = ['travel_bug', 'tech_guru', 'design_inspire'];
    if (mockAccounts.includes(receiverUsername)) {
      setTimeout(async () => {
        const replies = [
          `That sounds awesome! Let's definitely do that.`,
          `Haha, totally agree with you! 🙌`,
          `Oh cool! Thanks for sharing.`,
          `I'll be online in a bit, let's jump on a quick call if you have time.`,
          `Perfect! Talk to you soon.`
        ];
        const botText = replies[Math.floor(Math.random() * replies.length)];
        const botReply = new Message({
          senderUsername: receiverUsername,
          receiverUsername: req.user.username,
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        await botReply.save();
      }, 1500);
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Serve frontend routing fallback
app.get('/:page.html', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', req.params.page + '.html'), (err) => {
    if (err) next();
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- DATABASE SEEDER ---
async function seedDatabase() {
  try {
    // 1. Seed Users (Standard admin user)
    const existsAdmin = await User.findOne({ email: 'achark659@gmail.com' });
    if (!existsAdmin) {
      const hashedAdminPassword = await bcrypt.hash('achark659@gmail.com', 10);
      const adminUser = new User({
        username: 'achark659',
        name: 'Admin achark659',
        email: 'achark659@gmail.com',
        phoneNumber: '+15550199',
        password: hashedAdminPassword,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Platform Administrator Operations Account.',
        followers: '250',
        following: '98',
        role: 'admin'
      });
      await adminUser.save();
      console.log('Seeded Admin User: email: achark659@gmail.com, password: achark659@gmail.com');
    } else if (existsAdmin.role !== 'admin') {
      const hashedAdminPassword = await bcrypt.hash('achark659@gmail.com', 10);
      existsAdmin.role = 'admin';
      existsAdmin.password = hashedAdminPassword;
      await existsAdmin.save();
      console.log('Updated existing user to Admin User: achark659@gmail.com');
    }

    // 2. Seed Mock Accounts for Chats
    const mockUsernames = ['travel_bug', 'tech_guru', 'design_inspire'];
    for (const u of mockUsernames) {
      const exists = await User.findOne({ username: u });
      if (!exists) {
        const fakePass = await bcrypt.hash('password123', 10);
        const nameMap = {
          'travel_bug': 'Jessica Davis',
          'tech_guru': 'Alan Turing',
          'design_inspire': 'Elena Smith'
        };
        const avatarMap = {
          'travel_bug': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          'tech_guru': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&auto=format&fit=crop&q=80',
          'design_inspire': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
        };
        const newUser = new User({
          username: u,
          name: nameMap[u],
          email: `${u}@domain.com`,
          phoneNumber: '+15550000',
          password: fakePass,
          avatar: avatarMap[u],
          bio: 'Simulated creator account.',
          role: 'user'
        });
        await newUser.save();
      }
    }

    // 3. Seed Posts
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      const samplePosts = [
        {
          username: 'travel_bug',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          verified: true,
          location: 'Santorini, Greece',
          image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
          likes: ['design_inspire', 'karthik_codes'],
          caption: 'Chasing sunsets in the beautiful cliffs of Santorini. Truly a magical experience! 🌅🇬🇷 #travel #greece #wanderlust',
          comments: [
            { user: 'globetrotter', text: 'Stunning view! Adding this to my bucket list.' },
            { user: 'explorer_girl', text: 'What lens did you use for this?' }
          ]
        },
        {
          username: 'design_inspire',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
          verified: false,
          location: 'Design Studio',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          likes: ['travel_bug'],
          caption: 'Exploring abstract glassmorphic textures today. Thoughts on this color palette? 🎨💎 #uxdesign #web3 #glassmorphism',
          comments: [
            { user: 'pixel_perfect', text: 'This looks so clean, love the depth!' },
            { user: 'karthik_codes', text: 'Absolutely stellar, the purple gradient is perfect.' }
          ]
        }
      ];
      await Post.insertMany(samplePosts);
      console.log('Seeded default posts collections.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
