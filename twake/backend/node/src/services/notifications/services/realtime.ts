import { User, WebsocketMetadata } from "../../../utils/types";

export function getWebsocketInformation(user: User): WebsocketMetadata {
  return {
    room: getNotificationRoomName(user.id),
    encryption_key: "",
  };
}

export function getNotificationRoomName(userId: string): string {
  return `/notifications?type=private&user=${userId}`;
}
