const { z } = require("zod");
const axios = require("axios");

const transactionSchema = z.object({
  id: z.number().int().positive(),
  valor: z.number().int().positive(),
  tipo: z.enum(["c", "d"]),
  descricao: z.string().min(1).max(10)
});

const bankStatementSchema = z.number().int().positive();

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
      transactionSchema.parse({ id: parseInt(id), valor, tipo, descricao });
    } catch (error) {
      return reply.code(422).send({ error: error.errors });
    }

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
      bankStatementSchema.parse(parseInt(id));
    } catch (error) {
      return reply.code(422).send({ error: error.errors });
    }

    try {
      const response = await axios.get(`http://transaction-manager:9000/clientes/${id}/extrato`);
      reply.send(response.data);
    } catch (error) {
      reply.status(error.response.status).send(error.response.data);
    }
  });
};