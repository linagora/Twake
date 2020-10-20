import { EntityOperationResult } from "../api/crud-service";

export class RealtimeEntityEvent<Entity> {
  path: string;
  entity: Entity;
  result: EntityOperationResult<Entity>;
}

export class JoinRoomEvent {
  name: string;
}

export class LeaveRoomEvent {
  name: string;
}
