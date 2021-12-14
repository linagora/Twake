import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { WebsocketMetadata } from "../../utils/types";
import UserEntity from "./entities/user";

export function getWebsocketInformation(user: UserEntity): WebsocketMetadata {
  return {
    name: getName(user.id),
    room: getRoom(user.id),
  };
}

export function getUserRooms(context: ExecutionContext): WebsocketMetadata[] {
  return [
    {
      name: getName(context.user.id),
      room: getRoom(context.user.id),
    },
  ];
}

export function getRoom(userId: string): string {
  return `/me/${userId}`;
}

export function getName(userId: string): string {
  return `user-room-${userId}`;
}
