const Memcached = require("memcached");

class MemcachedConnection {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      this.connection = new Memcached(process.env.MEMCACHED_CONNECTION_URL, {
        retries: 10, // Número de tentativas antes de falhar
        retry: 10000, // Tempo em milissegundos entre as tentativas
        remove: true // Remover servidor do pool ao detectar falha
      });

      console.log("Conexão com o Memcached estabelecida com sucesso.");
    } catch (error) {
      console.error("Erro ao conectar ao Memcached:", error);
    }
  }

  getConnection() {
    if (!this.connection) {
      throw new Error("A conexão com o Memcached não foi estabelecida.");
    }
    return this.connection;
  }
}

const memcachedConnection = new MemcachedConnection();
module.exports = memcachedConnection.getConnection();