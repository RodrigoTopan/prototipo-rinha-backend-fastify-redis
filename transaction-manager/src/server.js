require("dotenv").config();
const Fastify = require("fastify");

const fastify = Fastify();

fastify.register(require("./routes"));

const startServer = async () => {
  try {
    await fastify.listen({ host: "0.0.0.0", port: 9000 });
    console.log("Servidor transaction manager em execução na porta 9000");
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();
