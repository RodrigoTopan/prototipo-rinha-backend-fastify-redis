const { createClient } = require("redis");

class RedisConnection {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      this.connection = createClient({
        url: process.env.REDIS_CONNECTION_URL
      });

      await this.connection.connect();
      
      this.connection.on("error", err => console.error("Redis Client Error", err));
      console.log("Conexão com o Redis estabelecida com sucesso.");
    } catch (error) {
      console.error("Erro ao conectar ao Redis:", error);
    }
  }

  getConnection() {
    if (!this.connection) {
      throw new Error("A conexão com o Redis não foi estabelecida.");
    }
    return this.connection;
  }
}

const redisConnection = new RedisConnection();
module.exports = redisConnection.getConnection();
