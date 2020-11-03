export class ContextualizedTarget {
  context?: ExecutionContext;
  readonly operation: OperationType;
}

export class EntityTarget<Entity> extends ContextualizedTarget {
  /**
   *
   * @param type type of entity
   * @param entity the entity itself
   */
  constructor(readonly type: string, readonly entity: Entity) {
    super();
  }
}

export class UpdateResult<Entity> extends EntityTarget<Entity> {
  readonly operation = OperationType.UPDATE;

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
  readonly operation = OperationType.CREATE;

  /**
   * Result sent back by the underlying database
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

export class SaveResult<Entity> extends EntityTarget<Entity> {
  /**
   * Result sent back by the underlying database
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;

  constructor(
    readonly type: string,
    readonly entity: Entity,
    readonly operation: OperationType.UPDATE | OperationType.CREATE,
  ) {
    super(type, entity);
  }
}

export class DeleteResult<Entity> extends EntityTarget<Entity> {
  readonly operation = OperationType.DELETE;

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

export class ListResult<Entity> extends ContextualizedTarget implements Paginable {
  // next page token
  page_token: string;

  constructor(readonly type: string, readonly entities: Entity[], nextPage?: Paginable) {
    super();
    this.page_token = nextPage?.page_token;
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  SAVE = "save",
  DELETE = "delete",
}

export declare type EntityOperationResult<Entity> =
  | CreateResult<Entity>
  | UpdateResult<Entity>
  | SaveResult<Entity>
  | DeleteResult<Entity>;

export interface ExecutionContext {
  user: { id: string };
  url: string;
  method: string;
  transport: "http" | "ws";
}

export interface Paginable {
  page_token?: string;
  max_results?: string;
}

export class Pagination implements Paginable {
  constructor(readonly page_token: string, readonly max_results = "100") {}
}

export interface CRUDService<Entity, PrimaryKey> {
  /**
   * Creates a resource
   *
   * @param item
   * @param context
   */
  create?(item: Entity, context?: ExecutionContext): Promise<CreateResult<Entity>>;

  /**
   * Get a resource
   *
   * @param pk
   * @param context
   */
  get(pk: PrimaryKey, context?: ExecutionContext): Promise<Entity>;

  /**
   * Update a resource
   *
   * @param pk
   * @param item
   * @param context
   */
  update?(
    pk: PrimaryKey,
    item: Entity,
    context?: ExecutionContext /* TODO: Options */,
  ): Promise<UpdateResult<Entity>>;

  /**
   * Save a resource.
   * If the resource exists, it is updated, if it does not exists, it is created.
   *
   * @param pk
   * @param item
   * @param context
   */
  save?(item: Entity, context?: ExecutionContext): Promise<SaveResult<Entity>>;

  /**
   * Delete a resource
   *
   * @param pk
   * @param context
   */
  delete(pk: PrimaryKey, context?: ExecutionContext): Promise<DeleteResult<Entity>>;

  /**
   * List a resource
   *
   * @param context
   */
  list(
    pagination: Paginable,
    context?: ExecutionContext /* TODO: Options */,
  ): Promise<ListResult<Entity>>;
}
