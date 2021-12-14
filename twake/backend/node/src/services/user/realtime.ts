import { WebsocketMetadata } from "../../utils/types";
import { UserObject } from "./web/types";

/**
 * User Rooms
 */
export function getUserRooms(user: UserObject): WebsocketMetadata[] {
  return [
    {
      name: getUserName(user.id),
      room: getUserRoom(user.id),
    },
  ];
}

export function getUserRoom(userId: string): string {
  return `/me/${userId}`;
}

export function getUserName(userId: string): string {
  return `user-room-${userId}`;
}
