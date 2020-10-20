import { EntityOperationResult } from "../api/crud-service";

export class RealtimeEntityEvent<Entity> {
  path: string;
  entity: Entity;
  result: EntityOperationResult<Entity>;
}
