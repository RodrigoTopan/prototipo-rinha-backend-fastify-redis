const axios = require("axios");

module.exports = async function routes(fastify, _) {
  fastify.get("/ping", async (request, reply) => {
    try {
      const response = await axios.get("http://transaction-manager:9000/ping");
      reply.send(response.data);
    } catch (error) {
      reply.status(error.response.status).send(error.response.data);
    }
  });

  fastify.post("/clientes/:id/transacoes", async (request, reply) => {
    const { id } = request.params;
    const { valor, tipo, descricao } = request.body;

    try {
      const response = await axios.post(`http://transaction-manager:9000/clientes/${id}/transacoes`, {
        valor,
        tipo,
        descricao
      });
      reply.send(response.data);
    } catch (error) {
      reply.status(error.response.status).send(error.response.data);
    }
  });

  fastify.get("/clientes/:id/extrato", async (request, reply) => {
    const { id } = request.params;

    try {
      const response = await axios.get(`http://transaction-manager:9000/clientes/${id}/extrato`);
      reply.send(response.data);
    } catch (error) {
      reply.status(error.response.status).send(error.response.data);
    }
  });
};