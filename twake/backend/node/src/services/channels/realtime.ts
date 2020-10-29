import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { User, Workspace, WebsocketMetadata } from "../types";
import { Channel } from "./entities";

export function getWebsocketInformation(channel: Channel): WebsocketMetadata {
  return {
    name: channel.name,
    room: getChannelPath(channel),
    encryption_key: ""
  };
}

export function getWorkspaceRooms(workspace: Workspace, user: User, includeDirect: boolean): WebsocketMetadata[] {
  return [
    { room: getPublicRoomName(workspace) },
    { room: getPrivateRoomName(workspace, user) },
    ...(includeDirect? [{ room: getDirectChannelRoomName(workspace, user)}]: [])
  ];
}

export function getDirectChannelRoomName(workspace: Workspace, user: User): string {
  return `/companies/${workspace.company_id}/workspaces/direct/channels?type=direct&user=${user.id}`;
}

export function getPrivateRoomName(workspace: Workspace, user: User): string {
  return `/companies/${workspace.company_id}/workspaces/${workspace.workspace_id}/channels?type=private&user=${user.id}`;
}

export function getPublicRoomName(workspace: Workspace): string {
  return `/companies/${workspace.company_id}/workspaces/${workspace.workspace_id}/channels?type=public`;
}

// TODO: The channel path depends on the execution context
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getChannelPath(channel: Channel, context?: ExecutionContext): string {
  return `${getChannelsPath()}/${channel.id}`;
}

export function getChannelsPath(): string {
  return "/channels";
}
