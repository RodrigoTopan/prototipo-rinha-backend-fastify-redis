const { z } = require("zod");
const memcached = require("./memcached/connection");

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
  cliente.ultimas_transacoes.sort(
    (a, b) => new Date(b.realizada_em) - new Date(a.realizada_em)
  );
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
  return new Promise((resolve, reject) => {
    memcached.get(`cliente:${id}`, (err, data) => {
      if (err) {
        console.error("Memcached error:", err);
        reply.code(500).send({ error: "Internal server error" });
        reject(err);
      } else {
        if (data) {
          resolve(JSON.parse(data));
        } else {
          reply.code(404).send();
          resolve(null);
        }
      }
    });
  });
}

async function cache(id, cliente) {
  return new Promise((resolve, reject) => {
    memcached.set(`cliente:${id}`, JSON.stringify(cliente), 3600, err => {
      if (err) {
        console.error("Memcached error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = async function routes(fastify, _) {
  fastify.get("/ping", handlePing);
  fastify.post("/clientes/:id/transacoes", handleTransactions);
  fastify.get("/clientes/:id/extrato", handleBankStatement);
};
