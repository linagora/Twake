import { concat, EMPTY, from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import {
  CreateResult,
  CrudExeption,
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
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
import Company, { CompanyPrimaryKey } from "../../../user/entities/company";
import { merge } from "lodash";
import WorkspacePendingUser, {
  WorkspacePendingUserPrimaryKey,
  TYPE as WorkspacePendingUserType,
} from "../../entities/workspace_pending_users";
import { CompanyUserRole } from "../../../user/web/types";
import { uuid } from "../../../../utils/types";
import _ from "lodash";
import { UsersServiceAPI } from "../../../user/api";

export class WorkspaceService implements WorkspaceServiceAPI {
  version: "1";
  private workspaceUserRepository: Repository<WorkspaceUser>;
  private workspaceRepository: Repository<Workspace>;
  private workspacePendingUserRepository: Repository<WorkspacePendingUser>;

  constructor(private database: DatabaseServiceAPI, private users: UsersServiceAPI) {}

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
        name: await this.getWorkspaceName(workspace.name, workspace.group_id),
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

  async save?<SaveOptions>(
    item: Partial<Workspace>,
    options?: SaveOptions,
    context?: WorkspaceExecutionContext,
  ): Promise<SaveResult<Workspace>> {
    let workspace = getWorkspaceInstance({
      ...item,
      ...{
        name: "",
        dateAdded: Date.now(),
        isDeleted: false,
        isArchived: false,
      },
    });

    if (item.id) {
      // ON UPDATE
      workspace = await this.get({
        id: item.id,
        group_id: context.company_id,
      });

      if (!workspace) {
        throw new Error(`Unable to edit inexistent workspace ${item.id}`);
      }
    }

    workspace = merge(workspace, {
      name: await this.getWorkspaceName(item.name, context.company_id),
      logo: item.logo,
      isDeleted: item.isDeleted,
      isArchived: item.isArchived,
    });

    await this.workspaceRepository.save(workspace);

    if (!item.id) {
      await this.addUser(
        { id: workspace.id, group_id: workspace.group_id },
        { id: context.user.id },
        "admin",
      );
    }

    return new SaveResult<Workspace>(
      TYPE,
      workspace,
      item.id ? OperationType.UPDATE : OperationType.CREATE,
    );
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

  async getAllForCompany(companyId: uuid): Promise<Workspace[]> {
    let allCompanyWorkspaces: Workspace[] = [];
    let nextPage: Pagination = new Pagination("", "100");
    do {
      const tmp = await this.workspaceRepository.find(
        { group_id: companyId },
        { pagination: nextPage },
      );
      nextPage = tmp.nextPage as Pagination;
      allCompanyWorkspaces = [...allCompanyWorkspaces, ...tmp.getEntities()];
    } while (nextPage.page_token);

    return allCompanyWorkspaces;
  }

  async addUser(
    workspacePk: WorkspacePrimaryKey,
    userPk: UserPrimaryKey,
    role: WorkspaceUserRole,
  ): Promise<void> {
    const user = await this.users.get(userPk);
    user.cache = Object.assign(user.cache || {}, {
      companies: _.uniq([...(user.cache?.companies || []), workspacePk.group_id]),
      workspaces: _.uniq([...(user.cache?.workspaces || []), workspacePk.id]),
    });
    await this.users.save(user, {}, { user: { id: user.id, server_request: true } });

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
    const allCompanyWorkspaces = await this.getAllForCompany(companyId.id);

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

  /**
   * @name GetWorkspaceName
   * @param exceptedName workspace name that user excepted to have
   * @param companyId company that user excepted to create or update the workspace
   * @returns if workspace name is already used in the company, this will return the exceptedName with the current duplicates number otherwise simply return the exceptedName
   */
  private async getWorkspaceName(exceptedName: string, companyId: string) {
    const workspacesList = await this.list(
      null,
      {},
      { company_id: companyId, user: { id: null, server_request: true } },
    );

    workspacesList.filterEntities(entity => _.includes(entity.name, exceptedName));

    const shouldRenameWorkspace = !workspacesList.isEmpty();
    const duplicatesCount = workspacesList.getEntities().length;

    return shouldRenameWorkspace ? `${exceptedName}(${duplicatesCount + 1})` : exceptedName;
  }
}
