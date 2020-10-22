import ORMServiceAPI from "../../orm/provider";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeCreated, RealtimeUpdated } from "../../../core/platform/framework/decorators";
import { UpdateResult, CreateResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";

export class ChannelService implements ChannelServiceAPI<Channel> {
  version = "1";

  constructor(private orm: ORMServiceAPI) {}

  @RealtimeCreated<Channel>("/channels")
  async create(channel: Channel): Promise<CreateResult<Channel>> {
    const entity = await this.orm.manager.save(channel);

    const result = new CreateResult<Channel>();
    result.entity = entity;

    return result;
  }

  get(id: string): Promise<Channel> {
    return this.orm.manager.findOne<Channel>(Channel, id);
  }

  @RealtimeUpdated("/channels")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, entity: Channel): Promise<UpdateResult<Channel>> {
    // TODO
    return null;
  }

  @RealtimeDeleted<string>((channel: string) => `/channels/${channel}`)
  async delete(id: string): Promise<DeleteResult<Channel>> {
    const result = await this.orm.manager.delete(Channel, id);

    return {
      deleted: result.affected && result.affected >=1,
      entity: null
    };
  }

  list(/* TODO: Options */): Promise<Channel[]> {
    return this.orm.manager.find<Channel>(Channel);
  }
}
