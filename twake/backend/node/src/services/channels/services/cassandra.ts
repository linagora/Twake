/* eslint-disable @typescript-eslint/no-unused-vars */
import cassandra from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeCreated, RealtimeUpdated } from "../../../core/platform/framework/decorators";
import { UpdateResult, CreateResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";

export class CassandraChannelService implements ChannelServiceAPI<Channel> {
  version = "1";

  constructor(private client: cassandra.Client) {}

  @RealtimeCreated<Channel>("/channels", channel => `/channels/${channel.id}`)
  create(channel: Channel): Promise<CreateResult<Channel>> {
    throw new Error("Not implemented");
  }

  get(id: string): Promise<Channel> {
    throw new Error("Not implemented");
  }

  @RealtimeUpdated<string>("/channels", id => `/channels/${id}`)
  async update(id: string, entity: Channel): Promise<UpdateResult<Channel>> {
    throw new Error("Not implemented");
  }

  @RealtimeDeleted<Channel>("/channels", channel => `/channels/${channel.id}`)
  async delete(id: string): Promise<DeleteResult<Channel>> {
    throw new Error("Not implemented");
  }

  async list(/* TODO: Options */): Promise<Channel[]> {
    throw new Error("Not implemented");
  }
}
