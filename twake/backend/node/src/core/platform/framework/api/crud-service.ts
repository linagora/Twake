export class EntityTarget<Entity> {
  /**
   *
   * @param type type of entity
   * @param entity the entity itself
   */
  constructor(readonly type: string, readonly entity: Entity) { }
}

export class SaveResult<Entity> extends EntityTarget<Entity> {
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

export declare type EntityOperationResult<Entity> = SaveResult<Entity> | DeleteResult<Entity>;

export interface CRUDService<Entity> {
  save(item: Entity): Promise<SaveResult<Entity>>;
  get(pk: { [column: string]: EntityId }): Promise<Entity>;
  delete(pk: { [column: string]: EntityId }): Promise<DeleteResult<Entity>>;
  list(pk: { [column: string]: EntityId }/* TODO: Options */): Promise<Entity[]>;
}
