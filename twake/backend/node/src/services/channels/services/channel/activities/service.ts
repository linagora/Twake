import { logger, Initializable } from "../../../../../core/platform/framework";
import { localEventBus } from "../../../../../core/platform/framework/pubsub";
import { Channel as ChannelEntity } from "../../../entities/";
import { ResourceEventsPayload } from "../../../../types";
import { GenericObjectType } from "./types";
import _, { sortBy } from "lodash";

export default class Activities implements Initializable {
  async init(): Promise<this> {
    const channelConnectorCreatedEvent = "channel:connector:created";
    const channelConnectorDeletedEvent = "channel:connector:deleted";
    const channelMemberCreatedEvent = "channel:member:created";
    const channelMemberDeletedEvent = "channel:member:deleted";
    const channelTabCreatedEvent = "channel:tab:created";
    const channelTabDeletedEvent = "channel:tab:deleted";
    const channelUpdatedEvent = "channel:updated";

    localEventBus.subscribe<ResourceEventsPayload>(channelMemberCreatedEvent, data =>
      this.logGenericData(channelMemberCreatedEvent, {
        type: "channel:activity:member:created",
        actor: {
          type: "user",
          id: data.actor.id,
        },
        context: {
          type: "add",
          array: [
            // data.actor.id !== data.member.user_id ? "invite" : "join"
            { type: "member", resource: data.resourcesAfter[0] },
          ],
        },
      }),
    );

    localEventBus.subscribe<ResourceEventsPayload>(channelMemberDeletedEvent, data =>
      this.logGenericData(channelMemberDeletedEvent, {
        type: "channel:activity:member:deleted",
        actor: {
          type: "user",
          id: data.actor.id,
        },
        context: {
          type: "remove",
          array: [{ type: "member", resource: data.resourcesBefore[0] }],
        },
      }),
    );

    localEventBus.subscribe<ResourceEventsPayload>(channelUpdatedEvent, data => {
      const interestedChanges = ["channel_group", "name", "description", "visibility", "icon"];
      const channelChanged = !_.isEqual(
        _.pick(data.resourcesBefore[0], interestedChanges),
        _.pick(data.resourcesAfter[0], interestedChanges),
      );

      const connectorsBefore: Partial<ChannelEntity> = _.pick(data.resourcesBefore[0], [
        "connectors",
      ]);

      const connectorsAfter: Partial<ChannelEntity> = _.pick(data.resourcesAfter[0], [
        "connectors",
      ]);

      const isConnectorCreated: boolean =
        connectorsBefore?.connectors.length < connectorsAfter?.connectors.length;

      const channelConnectorsChanged = !_.isEqual(
        { connectors: sortBy(connectorsBefore.connectors) },
        { connectors: sortBy(connectorsAfter.connectors) },
      );

      if (channelConnectorsChanged) {
        return localEventBus.publish(
          isConnectorCreated ? "channel:connector:created" : "channel:connector:deleted",
          data,
        );
      }

      if (channelChanged) {
        return this.logGenericData(channelUpdatedEvent, {
          type: "channel:activity:updated",
          actor: {
            type: "user",
            id: data.actor.id,
          },
          context: {
            type: "diff",
            previous: { type: "channel", resource: data.resourcesBefore[0] },
            next: { type: "channel", resource: data.resourcesAfter[0] },
          },
        });
      }
    });

    localEventBus.subscribe<ResourceEventsPayload>(channelTabCreatedEvent, data =>
      this.logGenericData(channelTabCreatedEvent, {
        type: "channel:activity:tab:created",
        actor: {
          type: "user",
          id: data.actor.id,
        },
        context: {
          type: "add",
          array: [{ type: "tab", resource: data.resourcesAfter[0] }],
        },
      }),
    );

    localEventBus.subscribe<ResourceEventsPayload>(channelTabDeletedEvent, data =>
      this.logGenericData(channelTabDeletedEvent, {
        type: "channel:activity:tab:deleted",
        actor: {
          type: "user",
          id: data.actor.id,
        },
        context: {
          type: "remove",
          array: [{ type: "tab", resource: data.resourcesAfter[0] }],
        },
      }),
    );

    localEventBus.subscribe<ResourceEventsPayload>(channelConnectorCreatedEvent, data => {
      return this.logGenericData(channelConnectorCreatedEvent, {
        type: "channel:activity:connector:created",
        actor: {
          type: "user",
          id: data.actor.id,
        },
        context: {
          type: "add",
          array: [{ type: "connector", resource: data.resourcesAfter[0] }],
        },
      });
    });

    localEventBus.subscribe<ResourceEventsPayload>(channelConnectorDeletedEvent, data => {
      this.logGenericData(channelConnectorDeletedEvent, {
        type: "channel:activity:connector:deleted",
        actor: {
          type: "user",
          id: data.actor.id,
        },
        context: {
          type: "remove",
          array: [{ type: "connector", resource: data.resourcesBefore[0] }],
        },
      });
    });

    return this;
  }

  // Log your generic data object
  logGenericData(event: string, data: GenericObjectType): void {
    const child = logger.child(data);
    child.debug(`Activities - New ${event} event`);
  }
}
