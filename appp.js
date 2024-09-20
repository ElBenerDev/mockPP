const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./userModel'); // Importa el modelo de usuario

const app = express();
const port = 3000;

// Middleware para analizar JSON
app.use(bodyParser.json());
app.use(cors()); // Habilitar CORS

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/usersDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        email,
        password: hashedPassword
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            res.status(409).json({ error: 'Email already in use' });
        } else {
            res.status(500).json({ error: 'Error registering user' });
        }
    }
});

// Ruta para el inicio de sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).send('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).send('Invalid password');
    }

    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
