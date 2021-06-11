import { DatabaseTableCreatedEvent, EntityDefinition } from "../../database/services/orm/types";
import { SearchAdapter } from "../api";

export default class Search implements SearchAdapter {
  constructor() {}

  public async connect() {}

  public async createIndex(_: DatabaseTableCreatedEvent) {}

  public async upsert(_: any[]) {}

  public async remove(_: any[]) {}
}
