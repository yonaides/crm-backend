const { gql } = require("apollo-server");

//Schema
const typeDefs = gql`
  type Usuario {
    id: ID
    nombre: String
    apellido: String
    email: String
    creado: String
    modificado: String
  }

  type Token {
    token: String
  }

  type Producto {
    id: ID
    nombre: String
    existencia: Int
    precio: Float
    creado: String
  }

  type Cliente {
    id: ID
    nombre: String
    apellido: String
    empresa: String
    email: String
    telefono: String
    vendedor: Usuario
  }

  type TopCliente {
    total: Float
    cliente: [Cliente]
  }
  type TopVendedores{
    total: Float
    vendedor: [Usuario]
  }

  input AutenticarInput {
    email: String!
    password: String!
  }

  input ProductoInput {
    nombre: String!
    existencia: Int!
    precio: Float!
  }

  input UsuarioInput {
    nombre: String!
    apellido: String!
    email: String!
    password: String!
  }

  input ClienteInput {
    nombre: String!
    apellido: String!
    empresa: String!
    email: String!
    telefono: String
  }

  input PedidoProductoInput {
    id: ID
    cantidad: Int
    nombre: String
    precio: Float
  }

  input PedidoInput {
    pedido: [PedidoProductoInput]
    total: Float
    cliente: ID!
    estado: EstadoPedido
  }

  enum EstadoPedido {
    PENDIENTE
    COMPLETADO
    CANCELADO
  }
  type Pedido {
    id: ID!
    pedido: [PedidoGrupo]
    total: Float
    cliente: Cliente
    vendedor: ID
    fecha: String
    estado: EstadoPedido
  }

  type PedidoGrupo {
    id: ID
    cantidad: Int
    nombre: String
    precio: Float
  }

  type Query {
    # Usuarios
    obtenerUsuario: Usuario

    #Productos
    obtenerProductos: [Producto]
    obtenerProducto(id: ID!): Producto

    #Clientes
    obtenerClientes: [Cliente]
    obtenerClienteVendedor: [Cliente]
    obtenerCliente(id: ID!): Cliente

    #Pedidos
    obtenerPedidos: [Pedido]
    obtenerPedidosVendedor: [Pedido]
    obtenerPedido(id: ID!): Pedido
    ObtenerPedidoEstado(estado: String!): [Pedido]

    #busquedas avanzadas
    mejoresClientes: [TopCliente]
    mejoresVendedores: [TopVendedores]
    buscarProducto(texto: String!) : [Producto]
    buscarProductoNombre(texto: String!): [Producto]
  }

  type Mutation {
    #Usuarios
    nuevoUsuario(input: UsuarioInput): Usuario
    autenticarUsuario(input: AutenticarInput): Token

    #Productos
    nuevoProducto(input: ProductoInput): Producto
    actualizarProducto(id: ID!, input: ProductoInput): Producto
    eliminarProducto(id: ID!): String

    #Clientes
    nuevoCliente(input: ClienteInput): Cliente
    actualizarCliente(id: ID!, input: ClienteInput): Cliente
    eliminarCliente(id: ID!): String

    #Pedidos
    nuevoPedido(input: PedidoInput): Pedido
    actualizarPedido(id: ID!, input: PedidoInput): Pedido
    eliminarPedido(id: ID!): String
  }
`;

module.exports = typeDefs;
