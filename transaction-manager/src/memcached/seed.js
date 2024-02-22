const memcached = require("./connection");

class Seed {
  constructor() {
    this.execute();
  }

  async execute() {
    try {
      const accounts = this.generateAccounts();
      await this.load(accounts);
    } catch (error) {
      console.error("Erro ao carregar chaves iniciais no Memcached:", error);
    }
  }

  generateAccounts() {
    return [
      { saldo: { total: 0, limite: 100000 }, ultimas_transacoes: [] },
      { saldo: { total: 0, limite: 80000 }, ultimas_transacoes: [] },
      { saldo: { total: 0, limite: 1000000 }, ultimas_transacoes: [] },
      { saldo: { total: 0, limite: 10000000 }, ultimas_transacoes: [] },
      { saldo: { total: 0, limite: 500000 }, ultimas_transacoes: [] }
    ];
  }

  async load(accounts) {
    for (let i = 0; i < accounts.length; i++) {
      const clientKey = `cliente:${i + 1}`;
      const accountData = JSON.stringify(accounts[i]);
      memcached.set(clientKey, accountData, 0, err => {
        if (err) {
          console.error(`Erro ao definir chave ${clientKey} no Memcached:`, err);
        } else {
          console.log(`Chave ${clientKey} definida no Memcached`);
        }
      });
    }
  }
}

module.exports = new Seed();