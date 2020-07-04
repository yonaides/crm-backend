const { ApolloServer } = require("apollo-server");
const jwt = require("jsonwebtoken");

const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");
const conectarDB = require("./config/db");

require("dotenv").config({ path: "variables.env" });
//conectar Database

conectarDB();

//servidor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers["authorization"] || "";

    if (token) {
      try {
        const usuario = jwt.verify(token.replace('Bearer ',''), process.env.PALABRA_SECRETA);

        return {
          usuario,
        };
      } catch (error) {
        throw new Error(" Autenticacion del usuario Erronea ");
      }
    }
  },
});

server.listen({port: process.env.PORT || 4000 }).then(({ url }) => console.log(`  servidor listo en ${url} `));
