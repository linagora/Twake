export class EntityTarget<Entity> {
  /**
   *
   * @param type type of entity
   * @param entity the entity itself
   */
  constructor(readonly type: string, readonly entity: Entity) {}
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
   *
   * @param type type of entity
   * @param entity the entity itself
   * @param deleted the entity has been deleted or not
   */
  constructor(readonly type: string, readonly entity: Entity, readonly deleted: boolean) {
    super(type, entity);
  }

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
