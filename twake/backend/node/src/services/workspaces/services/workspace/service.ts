import { concat, EMPTY, from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import {
  CreateResult,
  CrudExeption,
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
} from "../../../workspaces/entities/workspace_user";
import Workspace, {
  getInstance as getWorkspaceInstance,
  TYPE,
  TYPE as WorkspaceType,
  WorkspacePrimaryKey,
} from "../../../workspaces/entities/workspace";
import { WorkspaceExecutionContext, WorkspaceUserRole } from "../../types";
import { UserPrimaryKey } from "../../../user/entities/user";
import { CompanyPrimaryKey } from "../../../user/entities/company";
import { merge } from "lodash";
import WorkspacePendingUser, {
  WorkspacePendingUserPrimaryKey,
  TYPE as WorkspacePendingUserType,
  getInstance as getWorkspacePendingUserInstance,
} from "../../entities/workspace_pending_users";
import { CompanyUserRole } from "../../../user/web/types";
import { uuid } from "../../../../utils/types";

export class WorkspaceService implements WorkspaceServiceAPI {
  version: "1";
  private workspaceUserRepository: Repository<WorkspaceUser>;
  private workspaceRepository: Repository<Workspace>;
  private workspacePendingUserRepository: Repository<WorkspacePendingUser>;

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

    this.workspacePendingUserRepository = await this.database.getRepository<WorkspacePendingUser>(
      WorkspacePendingUserType,
      WorkspacePendingUser,
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

  async delete(
    pk: Partial<Pick<Workspace, "id">>,
    context?: WorkspaceExecutionContext,
  ): Promise<DeleteResult<Workspace>> {
    const primaryKey: Workspace = merge(new Workspace(), {
      group_id: context.company_id,
      id: pk.id,
    });
    await this.workspaceRepository.remove(primaryKey);
    return new DeleteResult(TYPE, primaryKey, true);
  }

  list<ListOptions>(
    pagination: Pagination,
    options?: ListOptions,
    context?: WorkspaceExecutionContext,
  ): Promise<ListResult<Workspace>> {
    const pk = { group_id: context.company_id };

    return this.workspaceRepository.find(pk, { pagination });
  }

  getAllForCompany(companyId: uuid): Promise<Workspace[]> {
    return this.workspaceRepository.find({ group_id: companyId }).then(a => a.getEntities());
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
        role: role,
      }),
    );
  }

  async updateUserRole(
    workspaceUserPk: WorkspaceUserPrimaryKey,
    role: WorkspaceUserRole,
  ): Promise<void> {
    const workspaceUser = await this.getUser(workspaceUserPk);
    if (!workspaceUser) {
      throw CrudExeption.notFound("WorkspaceUser entity not found");
    }
    await this.workspaceUserRepository.save(merge(workspaceUser, { role }));
  }

  async removeUser(
    workspaceUserPk: WorkspaceUserPrimaryKey,
  ): Promise<DeleteResult<WorkspaceUserPrimaryKey>> {
    const entity = await this.getUser(workspaceUserPk);

    if (!entity) {
      throw CrudExeption.notFound("WorkspaceUser entity not found");
    }

    await this.workspaceUserRepository.remove(entity);
    return new DeleteResult(WorkspaceUserType, workspaceUserPk, true);
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
    workspaceUserPk: Pick<WorkspaceUserPrimaryKey, "workspaceId" | "userId">,
  ): Promise<WorkspaceUser> {
    return this.workspaceUserRepository.findOne({
      workspace_id: workspaceUserPk.workspaceId,
      user_id: workspaceUserPk.userId,
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

  async addPendingUser(
    primaryKey: WorkspacePendingUserPrimaryKey,
    workspaceRole: WorkspaceUserRole,
    companyRole: CompanyUserRole,
  ): Promise<void> {
    if (await this.getPendingUser(primaryKey)) {
      throw CrudExeption.badRequest("User is pending already");
    }
    const workspacePendingUser = merge(new WorkspacePendingUser(), {
      workspace_id: primaryKey.workspace_id,
      email: primaryKey.email,
      role: workspaceRole,
      company_role: companyRole,
    });
    await this.workspacePendingUserRepository.save(workspacePendingUser);
  }

  getPendingUser(primaryKey: WorkspacePendingUserPrimaryKey): Promise<WorkspacePendingUser> {
    return this.workspacePendingUserRepository.findOne(primaryKey);
  }

  async getPendingUsers(
    primaryKey: Pick<WorkspacePendingUserPrimaryKey, "workspace_id">,
  ): Promise<WorkspacePendingUser[]> {
    return this.workspacePendingUserRepository.find(primaryKey).then(a => a.getEntities());
  }

  async removePendingUser(
    primaryKey: WorkspacePendingUserPrimaryKey,
  ): Promise<DeleteResult<WorkspacePendingUserPrimaryKey>> {
    const pendingUser = await this.getPendingUser(primaryKey);
    if (!pendingUser) {
      throw CrudExeption.notFound("Pending user not found");
    }
    await this.workspacePendingUserRepository.remove(pendingUser);
    return new DeleteResult(WorkspacePendingUserType, primaryKey, true);
  }
}
