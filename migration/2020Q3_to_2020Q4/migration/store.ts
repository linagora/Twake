import config from "config";
import cassandra from "cassandra-driver";
import DatabaseServiceClass from "./services/db/index";

const configuration: any = {
  db: config.get("db"),
  encryption: config.get("encryption"),
};

class Store {
  private databaseService: DatabaseServiceClass = null;
  private cassandraClient: any = null;

  async initOrmClient() {
    this.databaseService = new DatabaseServiceClass("cassandra", {
      ...config.get("db"),
    });
    this.databaseService.getConnector().connect();
  }
  getOrmClient() {
    return this.databaseService;
  }

  async initCassandraClient() {
    this.cassandraClient = new cassandra.Client({
      contactPoints: configuration.db.contactPoints,
      localDataCenter: configuration.db.localDataCenter,
      keyspace: configuration.db.keyspace,
    });
  }
  getCassandraClient() {
    return this.cassandraClient;
  }
}

export default new Store();
