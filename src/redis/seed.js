const redis = require("./connection");

class Seed {
  constructor() {
    this.execute();
  }

  async execute() {
    try {
      const accounts = this.generateAccounts();
      const multi = redis.multi();
      await this.load(multi, accounts);
    } catch (error) {
      console.error("Erro ao carregar chaves iniciais no redis:", error);
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

  async load(multi, accounts) {
    for (let i = 0; i < accounts.length; i++) {
      const clientKey = `cliente:${i + 1}`;
      const accountData = JSON.stringify(accounts[i]);
      multi.setNX(clientKey, accountData);
    }

    multi.exec((err, replies) => {
      if (err) {
        console.error("Erro ao definir chaves no redis:", err);
      } else {
        replies.forEach((reply, index) => {
          const clientKey = `cliente:${index + 1}`;
          if (reply === 1) {
            console.log(`Chave ${clientKey} definida no redis`);
          } else {
            console.log(`Chave ${clientKey} já existente no redis`);
          }
        });
      }
    });
  }
}

module.exports = new Seed();