const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Replace with your frontend URL

// Connect to MongoDB
mongoose.connect('mongodb+srv://tasneemmahmud2000:1122334455@cluster0.nti5kfn.mongodb.net/Jaanutuni?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Successfully connected to database'))
  .catch((err) => console.error('Failed to connect to database', err));

// Define User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Route for creating a user
app.post('/create', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send({ error: 'An unexpected error occurred while creating the user' });
  }
});

// Route for logging in
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    res.send({ message: 'Login successful', user: { username: user.username } });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ error: 'An unexpected error occurred while logging in' });
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
