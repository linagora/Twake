import ORMServiceAPI from "../../orm/provider";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeCreated, RealtimeUpdated } from "../../../core/platform/framework/decorators";
import { UpdateResult, CreateResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";

export class ChannelService implements ChannelServiceAPI<Channel> {
  version = "1";

  constructor(private orm: ORMServiceAPI) {}

  @RealtimeCreated<Channel>("/channels", channel => `/channels/${channel.id}`)
  async create(channel: Channel): Promise<CreateResult<Channel>> {
    const entity = await this.orm.manager.save(channel);

    return new CreateResult<Channel>("channel", entity);
  }

  get(id: string): Promise<Channel> {
    return this.orm.manager.findOne<Channel>(Channel, id);
  }

  @RealtimeUpdated<string>("/channels", id => `/channels/${id}`)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, entity: Channel): Promise<UpdateResult<Channel>> {
    // TODO
    return null;
  }

  @RealtimeDeleted<Channel>("/channels", channel => `/channels/${channel.id}`)
  async delete(id: string): Promise<DeleteResult<Channel>> {
    await this.orm.manager.delete(Channel, id);

    const result = new DeleteResult<Channel>("channel", { id } as Channel, true);
    // TODO: Be able to get delete status from the ORM
    // result.deleted = ormResult.affected && ormResult.affected >=1;

    return result;
  }

  list(/* TODO: Options */): Promise<Channel[]> {
    return this.orm.manager.find<Channel>(Channel);
  }
}
