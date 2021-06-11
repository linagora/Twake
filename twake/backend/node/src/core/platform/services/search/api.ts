import { TwakeServiceProvider } from "../../framework";
import { DatabaseTableCreatedEvent } from "../database/services/orm/types";

export interface SearchAdapter {
  connect(): Promise<void>;
  createIndex(event: DatabaseTableCreatedEvent): Promise<void>;
  upsert(entities: any[]): Promise<void>;
  remove(entities: any[]): Promise<void>;
}

export interface SearchServiceAPI extends TwakeServiceProvider {}

export type SearchConfiguration = {
  type?: false | "elasticsearch";
  elasticsearch?: {
    endpoint: string;
    flushInterval: number; //In milliseconds
  };
};
