const mongoose = require('mongoose');

// Definir el esquema del usuario
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Crear el modelo de usuario
const User = mongoose.model('User', userSchema);

module.exports = User;
