const { Client } = require("cassandra-driver");

class CassandraConnection {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      this.client = new Client({
        contactPoints: [process.env.CASSANDRA_CONTACT_POINTS], 
        localDataCenter: 'datacenter1',
        keyspace: 'accounts'
      });

      await this.client.connect();
      
      console.log("Conexão com o Cassandra estabelecida com sucesso.");
    } catch (error) {
      console.error("Erro ao conectar ao Cassandra:", error);
    }
  }

  async createKeyspaceAndTable() {
    await this.createKeyspace();
    await this.createTable();
  }

  async createKeyspace() {
    const query = `
      CREATE KEYSPACE IF NOT EXISTS accounts 
      WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
    `;

    try {
      await this.client.execute(query);
      console.log("Keyspace 'accounts' criado com sucesso.");
    } catch (error) {
      console.error("Erro ao criar o keyspace 'accounts':", error);
    }
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS accounts (
        id int PRIMARY KEY,
        saldo_total int,
        limite int,
        ultimas_transacoes list<text>
      );
    `;

    try {
      await this.client.execute(query);
      console.log("Tabela 'accounts' criada com sucesso.");
    } catch (error) {
      console.error("Erro ao criar a tabela 'accounts':", error);
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error("A conexão com o Cassandra não foi estabelecida.");
    }
    return this.client;
  }
}

const cassandraConnection = new CassandraConnection();
cassandraConnection.createKeyspaceAndTable(); 
module.exports = cassandraConnection.getClient();