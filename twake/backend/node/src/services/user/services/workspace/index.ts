import { concat, EMPTY, from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import {
  CreateResult,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { WorkspaceServiceAPI } from "../../api";
import { TYPE as WorkspaceUserType } from "../../entities/workspace_user";
import WorkspaceUser, { WorkspaceUserPrimaryKey } from "../../entities/workspace_user";
import Workspace, { WorkspacePrimaryKey } from "../../entities/workspace";
import { TYPE as WorkspaceType } from "../../entities/workspace";

export class WorkspaceService implements WorkspaceServiceAPI {
  version: "1";
  private workspaceUserRepository: Repository<WorkspaceUser>;
  private workspaceRepository: Repository<Workspace>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.workspaceUserRepository = await this.database.getRepository<WorkspaceUser>(
      WorkspaceUserType,
      WorkspaceUser,
    );

    this.workspaceRepository = await this.database.getRepository<Workspace>(
      WorkspaceType,
      Workspace,
    );

    return this;
  }

  get(pk: WorkspacePrimaryKey): Promise<Workspace> {
    return this.workspaceRepository.findOne(pk);
  }

  create?(item: Workspace, context?: ExecutionContext): Promise<CreateResult<Workspace>> {
    throw new Error("Method not implemented.");
  }

  update?(
    pk: Partial<Pick<Workspace, "id">>,
    item: Workspace,
    context?: ExecutionContext,
  ): Promise<UpdateResult<Workspace>> {
    throw new Error("Method not implemented.");
  }

  save?<SaveOptions>(
    item: Workspace,
    options?: SaveOptions,
    context?: ExecutionContext,
  ): Promise<SaveResult<Workspace>> {
    throw new Error("Method not implemented.");
  }

  delete(
    pk: Partial<Pick<Workspace, "id">>,
    context?: ExecutionContext,
  ): Promise<DeleteResult<Workspace>> {
    throw new Error("Method not implemented.");
  }

  list<ListOptions>(
    pagination: Pagination,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Workspace>> {
    return this.workspaceRepository.find({}, { pagination });
  }

  getUsers(
    workspaceId: Pick<WorkspaceUserPrimaryKey, "workspaceId">,
    pagination?: Paginable,
  ): Promise<ListResult<WorkspaceUser>> {
    return this.workspaceUserRepository.find(
      { workspace_id: workspaceId.workspaceId },
      { pagination: { limitStr: pagination?.limitStr, page_token: pagination?.page_token } },
    );
  }

  getAllUsers$(
    workspaceId: Pick<WorkspaceUserPrimaryKey, "workspaceId">,
    pagination?: Paginable,
  ): Observable<WorkspaceUser> {
    return from(this.getUsers(workspaceId, pagination)).pipe(
      mergeMap(workspaceUsers => {
        const items$ = from(workspaceUsers.getEntities());
        const next$ = workspaceUsers?.nextPage?.page_token
          ? this.getAllUsers$(workspaceId, workspaceUsers.nextPage)
          : EMPTY;

        return concat(items$, next$);
      }),
    );
  }
}

export function getService(database: DatabaseServiceAPI): WorkspaceService {
  return new WorkspaceService(database);
}
