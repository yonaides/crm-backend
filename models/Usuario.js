const mongoose = require("mongoose");

const UsuariosSchema = mongoose.Schema({
  nombre: {
    type: String,
    require: true,
    trim: true,
  },
  apellido: {
    type: String,
    require: true,
    trim: true,
  },
  email: {
    type: String,
    require: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
    trim: true,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
  modificado: { type: Date },
});

module.exports = mongoose.model("Usuario", UsuariosSchema);
