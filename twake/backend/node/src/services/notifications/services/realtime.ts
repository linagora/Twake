import { User, WebsocketMetadata } from "../../../services/types";

export function getWebsocketInformation(user: User): WebsocketMetadata {
  return {
    room: getNotificationRoomName(user),
    encryption_key: "",
  };
}

export function getNotificationRoomName(user: User): string {
  return `/notifications?type=private&user=${user.id}`;
}
