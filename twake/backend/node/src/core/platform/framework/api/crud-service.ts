export class EntityTarget<Entity> {
  entity: Entity;
}

export class UpdateResult<Entity> extends EntityTarget<Entity> {
  /**
   * Result sent back by the underlying database
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;

  /**
   * Number of rows affected by the update.
   */
  affected?: number;
}

export class CreateResult<Entity> extends EntityTarget<Entity> {
  /**
   * Result sent back by the underlying database
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

export class DeleteResult<Entity> extends EntityTarget<Entity>  {
  /**
   * True if the entity has been removed from the database
   */
  deleted: boolean;
}

export declare type EntityId = string | number;

export declare type EntityOperationResult<Entity> = CreateResult<Entity> | UpdateResult<Entity> | DeleteResult<Entity>;

export interface CRUDService<Entity> {
  create(item: Entity): Promise<CreateResult<Entity>>;
  get(id: EntityId): Promise<Entity>;
  update(id: EntityId, item: Entity, /* TODO: Options */): Promise<UpdateResult<Entity>>;
  delete(id: EntityId): Promise<DeleteResult<Entity>>;
  list(/* TODO: Options */): Promise<Entity[]>;
}
