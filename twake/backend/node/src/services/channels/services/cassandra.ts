/* eslint-disable @typescript-eslint/no-unused-vars */
import cassandra from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import {
  UpdateResult,
  CreateResult,
  DeleteResult,
} from "../../../core/platform/framework/api/crud-service";

export class CassandraChannelService implements ChannelServiceAPI {
  version = "1";

  constructor(private client: cassandra.Client) {}

  create(channel: Channel): Promise<CreateResult<Channel>> {
    throw new Error("Not implemented");
  }

  get(id: string): Promise<Channel> {
    throw new Error("Not implemented");
  }

  async update(id: string, entity: Channel): Promise<UpdateResult<Channel>> {
    throw new Error("Not implemented");
  }

  async delete(id: string): Promise<DeleteResult<Channel>> {
    throw new Error("Not implemented");
  }

  async list(/* TODO: Options */): Promise<Channel[]> {
    throw new Error("Not implemented");
  }
}
