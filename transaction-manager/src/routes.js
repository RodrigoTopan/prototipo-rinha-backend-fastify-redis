const clientesData = [];

// Função para gerar contas de cliente padrão
function generateAccounts() {
  return [
    { saldo: { total: 0, limite: 100000 }, ultimas_transacoes: [] },
    { saldo: { total: 0, limite: 80000 }, ultimas_transacoes: [] },
    { saldo: { total: 0, limite: 1000000 }, ultimas_transacoes: [] },
    { saldo: { total: 0, limite: 10000000 }, ultimas_transacoes: [] },
    { saldo: { total: 0, limite: 500000 }, ultimas_transacoes: [] }
  ];
}

function loadDefaultAccounts() {
  const accounts = generateAccounts();
  accounts.forEach((account, index) => {
    const id = index + 1; // IDs começam de 1
    clientesData.push({ id, ...account });
  });
}

loadDefaultAccounts();

async function handlePing(request, reply) {
  console.log("pong");
  return reply.code(200).send({ success: true });
}

async function handleTransactions(request, reply) {
  const { id } = request.params;
  const { valor, tipo, descricao } = request.body;

  const clienteIndex = parseInt(id) - 1;
  const cliente = clientesData[clienteIndex];
  if (!cliente) {
    return reply.code(404).send();
  }

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
  cliente.ultimas_transacoes = cliente.ultimas_transacoes.slice(0, 10); // Limitar a 10 transações diretamente

  return {
    saldo: cliente.saldo.total,
    limite: cliente.saldo.limite
  };
}

async function handleBankStatement(request, reply) {
  const { id } = request.params;

  const clienteIndex = parseInt(id) - 1;
  const cliente = clientesData[clienteIndex];
  if (!cliente) {
    return reply.code(404).send();
  }

  return cliente;
}

module.exports = async function routes(fastify, _) {
  fastify.get("/ping", handlePing);
  fastify.post("/clientes/:id/transacoes", handleTransactions);
  fastify.get("/clientes/:id/extrato", handleBankStatement);
};