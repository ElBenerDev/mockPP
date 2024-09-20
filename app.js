const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();  // Para cargar variables de entorno

const app = express();
const port = 3000;

// Middleware para analizar JSON
app.use(bodyParser.json());
app.use(cors());  // Habilitar CORS para aceptar solicitudes desde otros orígenes

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/usersDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Definir el esquema del usuario
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Encriptar la contraseña antes de guardarla
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

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Generar un token JWT para la sesión del usuario
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

