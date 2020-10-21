import { EntityOperationResult } from "../api/crud-service";

export class RealtimeEntityEvent<Entity> {
  path: string;
  entity: Entity;
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
