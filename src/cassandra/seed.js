const cassandraClient = require("./connection");

class Seed {
  constructor() {
    this.execute();
  }

  async execute() {
    try {
      const accounts = this.generateAccounts();
      await this.load(accounts);
    } catch (error) {
      console.error("Erro ao carregar chaves iniciais no Cassandra:", error);
    }
  }

  generateAccounts() {
    return [
      { id: 1, saldo_total: 0, limite: 100000, ultimas_transacoes: [] },
      { id: 2, saldo_total: 0, limite: 80000, ultimas_transacoes: [] },
      { id: 3, saldo_total: 0, limite: 1000000, ultimas_transacoes: [] },
      { id: 4, saldo_total: 0, limite: 10000000, ultimas_transacoes: [] },
      { id: 5, saldo_total: 0, limite: 500000, ultimas_transacoes: [] }
    ];
  }

  async load(accounts) {
    const queries = accounts.map(account => {
      return {
        query: 'INSERT INTO accounts (id, saldo_total, limite, ultimas_transacoes) VALUES (?, ?, ?, ?)',
        params: [account.id, account.saldo_total, account.limite, account.ultimas_transacoes]
      };
    });

    await cassandraClient.batch(queries, { prepare: true });

    console.log("Chaves definidas no Cassandra");
  }
}

module.exports = new Seed();