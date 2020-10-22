import { EntityOperationResult } from "../api/crud-service";

export enum RealtimeEntityActionType {
  Created = "created",
  Updated = "updated",
  Deleted = "deleted"
}
export class RealtimeEntityEvent<Entity> {
  // the type of the resource
  type: string;
  // the path of the resource
  path: string;
  // the full path of the resource
  resourcePath: string;
  // the input resource
  entity: Entity;
  // the action result which fired this event
  result: EntityOperationResult<Entity>;
}

export class JoinRoomEvent {
  name: string;
  token?: string;
}

export class LeaveRoomEvent {
  name: string;
}

export interface JoinLeaveRoomError {
  name: string;
  message?: string;
  type?: string;
}

export interface JoinLeaveRoomSuccess {
  name: string;
  message?: string;
}
