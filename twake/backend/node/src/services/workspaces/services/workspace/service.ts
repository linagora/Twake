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
import WorkspaceUser, {
  getInstance as getWorkspaceUserInstance,
  TYPE as WorkspaceUserType,
  WorkspaceUserPrimaryKey,
} from "../../../user/entities/workspace_user";
import Workspace, {
  getInstance as getWorkspaceInstance,
  TYPE,
  TYPE as WorkspaceType,
  WorkspacePrimaryKey,
} from "../../../workspaces/entities/workspace";
import { WorkspaceExecutionContext, WorkspaceUserRole } from "../../types";
import { UserPrimaryKey } from "../../../user/entities/user";
import { CompanyPrimaryKey } from "../../../user/entities/company";

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

  async create(workspace: Workspace, context?: ExecutionContext): Promise<CreateResult<Workspace>> {
    const workspaceToCreate: Workspace = getWorkspaceInstance({
      ...workspace,
      ...{
        dateAdded: Date.now(),
        isDeleted: false,
        isArchived: false,
      },
    });

    await this.workspaceRepository.save(workspaceToCreate);
    return new CreateResult<Workspace>(TYPE, workspaceToCreate);
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
    context?: WorkspaceExecutionContext,
  ): Promise<ListResult<Workspace>> {
    const pk = { group_id: context.company_id };

    return this.workspaceRepository.find(pk, { pagination });
  }

  async addUser(
    workspacePk: WorkspacePrimaryKey,
    userPk: UserPrimaryKey,
    role: WorkspaceUserRole,
  ): Promise<void> {
    await this.workspaceUserRepository.save(
      getWorkspaceUserInstance({
        workspaceId: workspacePk.id,
        userId: userPk.id,
        // role: WorkspaceUserRole, // FixME
        role: "member",
      }),
    );
  }

  async removeUser(workspacePk: WorkspacePrimaryKey, userPk: UserPrimaryKey): Promise<void> {
    await this.workspaceUserRepository.remove(
      getWorkspaceUserInstance({
        workspaceId: workspacePk.id,
        userId: userPk.id,
      }),
    );
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

  getUser(
    workspaceUser: Pick<WorkspaceUserPrimaryKey, "workspaceId" | "userId">,
  ): Promise<WorkspaceUser> {
    return this.workspaceUserRepository.findOne({
      workspace_id: workspaceUser.workspaceId,
      user_id: workspaceUser.userId,
    });
  }

  async getAllForUser(
    userId: Pick<WorkspaceUserPrimaryKey, "userId">,
    companyId: CompanyPrimaryKey,
  ): Promise<WorkspaceUser[]> {
    const allCompanyWorkspaces = await this.workspaceRepository
      .find({ group_id: companyId.id })
      .then(a => a.getEntities());

    const UserWorkspaces = await Promise.all(
      allCompanyWorkspaces.map(workspace =>
        this.workspaceUserRepository.findOne({
          user_id: userId.userId,
          workspace_id: workspace.id,
        }),
      ),
    );

    return UserWorkspaces.filter(uw => uw);
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
