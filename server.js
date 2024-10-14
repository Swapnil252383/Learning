// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize app and set port
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://Swapnil:Swapnil@cluster0.o9y8k.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    mobile: { type: String, unique: true },
    gender: { type: String, enum: ['male', 'female'], required: true }
});

const User = mongoose.model('User', userSchema);

// Contact Message Schema
// Contact Message Schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Add required validation
    email: { type: String, required: true }, // Add required validation
    message: { type: String, required: true } // Add required validation
});

const ContactMessage = mongoose.model('ContactMessage', contactSchema);


// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key';

// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, password, mobile, gender } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, mobile, gender });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Error creating user', details: err.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ username: user.name, email: user.email, mobile: user.mobile, gender: user.gender, token, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Middleware to authenticate user
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Route to get user details
app.get('/api/user/me', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('name email mobile gender -password'); // Exclude password
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// Route to save contact messages
app.post('/contact', async (req, res) => {
    console.log('Received contact message:', req.body); // Log the request body
    const { name, email, message } = req.body;
    const newMessage = new ContactMessage({ name, email, message });

    try {
        await newMessage.save();
        res.status(201).json({ message: 'Message saved successfully' });
    } catch (err) {
        console.error('Error saving message:', err); // Log the error
        res.status(400).json({ error: 'Error saving message', details: err.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
