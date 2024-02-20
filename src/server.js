require("dotenv").config();
require("./redis/seed");
const Fastify = require("fastify");

const fastify = Fastify();

fastify.register(require('./routes'));

const startServer = async () => {
    try {
        await fastify.listen({ host: '0.0.0.0', port: 8080 });
        console.log('Servidor em execução na porta 8080');
    } catch (error) {
        console.error("Erro ao iniciar o servidor:", error);
        process.exit(1);
    }
}

startServer();