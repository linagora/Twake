import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";
import { Channel } from "./channel";

@EventSubscriber()
export class ChannelSubscriber implements EntitySubscriberInterface<Channel> {

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function {
    return Channel;
  }

  afterInsert(event: InsertEvent<Channel>): void {
    console.log("Channel created", event.entity);
  }

  afterUpdate(event: UpdateEvent<Channel>): void {
    console.log("Channel updated", event.entity);
  }

  afterRemove(event: RemoveEvent<Channel>): void {
    console.log("Channel removed", event.entity);
  }
}