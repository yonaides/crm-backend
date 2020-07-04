const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: "variables.env" });

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
};

//Resolvers
const resolvers = {
  Query: {
    obtenerUsuario: async (_, { }, ctx) => {
      return ctx.usuario;
      /*const usuarioId = await jwt.verify(token, process.env.PALABRA_SECRETA);
      return usuarioId;*/
    },
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (error) {
        console.log("error : ");
        console.log(error);
      }
    },
    obtenerProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      return producto;
    },
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (error) {
        throw new Error("Error al buscar todos los clientes");
      }
    },
    obtenerClienteVendedor: async (_, {}, ctx) => {
      try {
        const clientes = await Cliente.find({
          vendedor: ctx.usuario.id.toString(),
        });

        return clientes;
      } catch (error) {
        throw new Error("Error al buscar todos los clientes");
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      // Revisar si el cliente existe
      const cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("No existe cliente con ese ID");
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene permiso para ver cliente");
      }

      return cliente;
    },
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});
        return pedidos;
      } catch (error) {
        throw new Error("Error al buscar los pedidos");
      }
    },
    obtenerPedidosVendedor: async (_, {}, ctx) => {
      try {
        const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
        return pedidos;
      } catch (error) {
        throw new Error("Error al buscar los pedidos por vendedor");
      }
    },
    obtenerPedido: async (_, { estado }, ctx) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene permiso para ver este pedido");
      }

      return pedido;
    },
    ObtenerPedidoEstado: async (_, { estado }, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });

      return pedidos;
    },
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$cliente",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente",
          },
        },
        {
          $limit: 10,
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]);

      return clientes;
    },
    mejoresVendedores: async () => {
      const vendedores = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$vendedor",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "vendedor",
          },
        },
        {
          $limit: 5,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return vendedores;
    },
    buscarProducto: async (_, { texto }) => {
      const productos = await Producto.find({
        nombre: { $regex: texto, $options: "i" },
      }).limit(10);

      return productos;
    },
    buscarProductoNombre: async (_, { texto }) => {
      const productos = await Producto.find({
        $text: { $search: texto },
      });

      return productos;
    },
  },
  Cliente:{
    vendedor: (parent) => {
        return Usuario.findById(parent.vendedor);
    }
  },
  Pedido:{
    cliente: (parent) => {
      return Cliente.findById(parent.cliente);
    }
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });

      if (existeUsuario) {
        throw new Error("Este email ya existe");
      }

      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      try {
        const usuario = new Usuario(input);
        Usuario.create(usuario);
        return usuario;
      } catch (error) {
        console.log("error ");
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });

      if (!existeUsuario) {
        throw new Error("Este email No existe");
      }

      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );

      if (!passwordCorrecto) {
        throw new Error("Password es incorrecto");
      }

      return {
        token: crearToken(existeUsuario, process.env.PALABRA_SECRETA, "24h"),
      };
    },
    nuevoProducto: async (_, { input }) => {
      try {

        const producto = new Producto(input);

        //almacenar en base de datos
        const resultado = await producto.save();
        return resultado;
      } catch (error) {
        throw new Error(" Error al salvar el producto");
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      try {
        let producto = await Producto.findById(id);
        if (!producto) {
          throw new Error("Producto no encontrado");
        }

        producto = await Producto.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return producto;
      } catch (error) {
        console.log(error);
        throw new Error("Error al actualizar el producto ");
      }
    },
    eliminarProducto: async (_, { id }) => {
      try {
        const producto = await Producto.findById(id);
        if (!producto) {
          throw new Error("Producto no encontrado");
        }

        await Producto.findOneAndDelete({ _id: id });
        return "Producto eliminado";
      } catch (error) {
        console.log(error);
        throw new Error("Error al borrar el producto ");
      }
    },
    nuevoCliente: async (_, { input }, ctx) => {
      const { email } = input;
      const clienteEncontrado = await Cliente.findOne({ email });

      if (clienteEncontrado) {
        throw new Error("Cliente ya existe ");
      }

      try {
        const nuevoCliente = new Cliente(input);
        nuevoCliente.vendedor = ctx.usuario.id;

        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (error) {
        console.log(error);
        throw new Error("Error al registrar el cliente ");
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      let cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("Cliente no existe");
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes permisos para actualizar clientes");
      }

      cliente = await Cliente.findByIdAndUpdate({ _id: id }, input, {
        new: true,
      });

      return cliente;
    },
    eliminarCliente: async (_, { id }, ctx) => {
      let cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("Cliente no existe");
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes permisos para eliminar clientes");
      }

      await Cliente.findOneAndDelete({ _id: id });

      return "Cliente Eliminado";
    },
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;
      let clienteExiste = await Cliente.findById(cliente);

      if (!clienteExiste) {
        throw new Error("Cliente no existe ");
      }

      if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene permiso para este cliente ");
      }

      for await (const articulo of input.pedido) {
        const { id } = articulo;
        let producto = await Producto.findById(id);
        if (articulo.cantidad > producto.existencia) {
          throw new Error(
            `El aticulo ${producto.nombre} pedido sobrepasa la cantidad disponible`
          );
        } else {
          producto.existencia = producto.existencia - articulo.cantidad;
          await producto.save();
        }
      }

      let nuevoPedido = new Pedido(input);

      nuevoPedido.vendedor = ctx.usuario.id;

      const resultado = nuevoPedido.save();
      return resultado;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente } = input;
      let clienteExiste = await Cliente.findById(cliente);

      if (!clienteExiste) {
        throw new Error("Cliente no existe");
      }

      const existePedido = await Pedido.findById(id);
      if (!existePedido) {
        throw new Error("El pedido no existe");
      }

      if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
        throw new Error(
          "No tiene permisos para hacer transacciones con este cliente"
        );
      }

      if (input.pedido) {
        for await (const articulo of input.pedido) {
          const { id } = articulo;
          let producto = await Producto.findById(id);
          if (articulo.cantidad > producto.existencia) {
            throw new Error(
              `El aticulo ${producto.nombre} pedido sobrepasa la cantidad disponible`
            );
          } else {
            producto.existencia = producto.existencia - articulo.cantidad;
            await producto.save();
          }
        }
      }

      const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return resultado;
    },
    eliminarPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error(
          "No tiene permiso para realizar transacciones con este pedido"
        );
      }

      await Pedido.findOneAndDelete({ _id: id });

      return "Pedido borrado";
    },
  },
};

module.exports = resolvers;
