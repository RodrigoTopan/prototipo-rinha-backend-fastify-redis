const { z } = require("zod");
const redis = require("./redis/connection");

const transactionSchema = z.object({
  id: z.number().int().positive(),
  valor: z.number().int().positive(),
  tipo: z.enum(["c", "d"]),
  descricao: z.string().min(1).max(10)
});

const bankStatementSchema = z.number().int().positive();

async function handlePing(request, reply) {
  console.log("pong");
  return reply.code(200).send({ success: true });
}

async function handleTransactions(request, reply) {
  const { id } = request.params;
  const { valor, tipo, descricao } = request.body;

  try {
    transactionSchema.parse({ id: parseInt(id), valor, tipo, descricao });
  } catch (error) {
    return reply.code(422).send({ error: error.errors });
  }

  const cliente = await getCache(id, reply);
  if (!cliente) return;

  if (tipo === "d") {
    if (cliente.saldo.total - valor < cliente.saldo.limite * -1) {
      return reply.code(422).send({
        error: "Transação de débito inválida. Saldo ficaria inconsistente."
      });
    }
    cliente.saldo.total -= valor;
  } else if (tipo === "c") {
    cliente.saldo.total += valor;
  }

  const transacao = {
    valor,
    tipo,
    descricao,
    realizada_em: new Date().toISOString()
  };

  cliente.ultimas_transacoes.unshift(transacao);
  cliente.ultimas_transacoes.sort((a, b) => new Date(b.realizada_em) - new Date(a.realizada_em));
  cliente.ultimas_transacoes = cliente.ultimas_transacoes.slice(0, 10);

  await cache(id, cliente);

  return {
    saldo: cliente.saldo.total,
    limite: cliente.saldo.limite
  };
}

async function handleBankStatement(request, reply) {
  const { id } = request.params;

  try {
    bankStatementSchema.parse(parseInt(id));
  } catch (error) {
    return reply.code(422).send({ error: error.errors });
  }

  const cliente = await getCache(id, reply);
  if (!cliente) return;

  return cliente;
}

async function getCache(id, reply) {
  const key = `cliente:${id}`;
  const value = await redis.get(key);
  if (!value) {
    reply.code(404).send();
    return null;
  }
  return JSON.parse(value);
}

async function cache(id, cliente) {
  const key = `cliente:${id}`;
  await redis.set(key, JSON.stringify(cliente));
}

module.exports = async function routes(fastify, _) {
  fastify.get("/ping", handlePing);
  fastify.post("/clientes/:id/transacoes", handleTransactions);
  fastify.get("/clientes/:id/extrato", handleBankStatement);
};