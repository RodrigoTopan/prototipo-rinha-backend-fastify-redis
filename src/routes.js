const { z } = require("zod");
const cassandraClient = require("./cassandra/connection");

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

  const cliente = await getFromCassandra(id, reply);
  if (!cliente) return;


  if (tipo === "d") {
    if (cliente.saldo_total - valor < cliente.limite * -1) {
      return reply.code(422).send({
        error: "Transação de débito inválida. Saldo ficaria inconsistente."
      });
    }
    cliente.saldo_total -= valor;
  } else if (tipo === "c") {
    cliente.saldo_total += valor;
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


  await saveToCassandra(id, cliente);

  return {
    saldo: cliente.saldo_total,
    limite: cliente.limite
  };
}


async function handleBankStatement(request, reply) {
  const { id } = request.params;

  try {
    bankStatementSchema.parse(parseInt(id));
  } catch (error) {
    return reply.code(422).send({ error: error.errors });
  }

  const cliente = await getFromCassandra(id, reply);
  if (!cliente) return;


  const saldo = {
    total: cliente.saldo_total,
    data_extrato: new Date().toISOString(),
    limite: cliente.limite
  };

  const ultimas_transacoes = cliente.ultimas_transacoes.map(transacao => {
    return {
      valor: transacao.valor,
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      realizada_em: transacao.realizada_em
    };
  });


  return {
    saldo,
    ultimas_transacoes
  };
}

async function getFromCassandra(id, reply) {
  const query = 'SELECT * FROM accounts WHERE id = ?';
  const params = [parseInt(id)];

  try {
    const result = await cassandraClient.execute(query, params, { prepare: true });
    if (!result.rows.length) {
      reply.code(404).send({ error: "Cliente não encontrado" });
      return null;
    }
    
    let { id: clientId, saldo_total, limite, ultimas_transacoes } = result.rows[0];
    ultimas_transacoes = ultimas_transacoes || []
    ultimas_transacoes = ultimas_transacoes.map(transacao => JSON.parse(transacao));
  
    const clientData = {
      id: clientId,
      saldo_total,
      limite,
      ultimas_transacoes
    };
    return clientData;
  } catch (error) {
    console.error("Erro ao buscar cliente no Cassandra:", error);
    reply.code(500).send({ error: "Erro interno do servidor" });
    return null;
  }
}


async function saveToCassandra(id, cliente) {
  const query = 'UPDATE accounts SET saldo_total = ?, ultimas_transacoes = ? WHERE id = ?';
  const transacoes = cliente.ultimas_transacoes.map(transacao => JSON.stringify(transacao));
  const params = [cliente.saldo_total, transacoes, parseInt(id)];

  try {
    await cassandraClient.execute(query, params, { prepare: true });
  } catch (error) {
    console.error("Erro ao salvar cliente no Cassandra:", error);
  
  }
}

module.exports = async function routes(fastify, _) {
  fastify.get("/ping", handlePing);
  fastify.post("/clientes/:id/transacoes", handleTransactions);
  fastify.get("/clientes/:id/extrato", handleBankStatement);
};
