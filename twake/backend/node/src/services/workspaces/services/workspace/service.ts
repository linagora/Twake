import { concat, EMPTY, from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
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
import User, { UserPrimaryKey } from "../../../user/entities/user";
import { CompanyPrimaryKey } from "../../../user/entities/company";
import _, { merge } from "lodash";
import WorkspacePendingUser, {
  TYPE as WorkspacePendingUserType,
  WorkspacePendingUserPrimaryKey,
} from "../../entities/workspace_pending_users";
import { CompanyUserRole } from "../../../user/web/types";
import { uuid } from "../../../../utils/types";
import { CompaniesServiceAPI, UsersServiceAPI } from "../../../user/api";
import { CounterProvider } from "../../../../core/platform/services/counter/provider";
import {
  TYPE as WorkspaceCounterEntityType,
  WorkspaceCounterEntity,
  WorkspaceCounterPrimaryKey,
} from "../../entities/workspace_counters";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";
import { countRepositoryItems } from "../../../../utils/counters";
import { ApplicationServiceAPI } from "../../../applications/api";
import { RealtimeSaved } from "../../../../core/platform/framework";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import { getRoomName, getWorkspacePath } from "../../realtime";
import { InviteTokenObject, WorkspaceInviteTokenObject } from "../../web/types";
import WorkspaceInviteTokens, {
  TYPE as WorkspaceInviteTokensType,
  getInstance as getWorkspaceInviteTokensInstance,
  WorkspaceInviteTokensPrimaryKey,
} from "../../entities/workspace_invite_tokens";
import AuthServiceAPI from "../../../../core/platform/services/auth/provider";
import { randomBytes } from "crypto";
import { Readable } from "stream";
import { reduceUUID4 } from "../../../../utils/uuid-reducer";
import { expandUUID4 } from "../../../../utils/uuid-reducer";

export class WorkspaceService implements WorkspaceServiceAPI {
  version: "1";
  private workspaceUserRepository: Repository<WorkspaceUser>;
  private workspaceRepository: Repository<Workspace>;
  private workspacePendingUserRepository: Repository<WorkspacePendingUser>;
  private workspaceCounter: CounterProvider<WorkspaceCounterEntity>;
  private workspaceInviteTokensRepository: Repository<WorkspaceInviteTokens>;

  constructor(
    private platformServices: PlatformServicesAPI,
    private users: UsersServiceAPI,
    private companies: CompaniesServiceAPI,
    private applications: ApplicationServiceAPI,
    private auth: AuthServiceAPI,
  ) {}

  async init(): Promise<this> {
    this.workspaceUserRepository =
      await this.platformServices.database.getRepository<WorkspaceUser>(
        WorkspaceUserType,
        WorkspaceUser,
      );

    this.workspaceRepository = await this.platformServices.database.getRepository<Workspace>(
      WorkspaceType,
      Workspace,
    );

    const workspaceCountersRepository =
      await this.platformServices.database.getRepository<WorkspaceCounterEntity>(
        WorkspaceCounterEntityType,
        WorkspaceCounterEntity,
      );

    this.workspacePendingUserRepository =
      await this.platformServices.database.getRepository<WorkspacePendingUser>(
        WorkspacePendingUserType,
        WorkspacePendingUser,
      );

    this.workspaceCounter = await this.platformServices.counter.getCounter<WorkspaceCounterEntity>(
      workspaceCountersRepository,
    );

    this.workspaceCounter.setReviseCallback(async (pk: WorkspaceCounterPrimaryKey) => {
      if (pk.counter_type == "members") {
        return countRepositoryItems(this.workspaceUserRepository, { workspace_id: pk.id });
      }
      return 0;
    });

    this.workspaceInviteTokensRepository =
      await this.platformServices.database.getRepository<WorkspaceInviteTokens>(
        WorkspaceInviteTokensType,
        WorkspaceInviteTokens,
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
        name: await this.getWorkspaceName(workspace.name, workspace.company_id, workspace.id),
        dateAdded: Date.now(),
        isDeleted: false,
        isArchived: false,
      },
    });

    const userId = context?.user?.id || "";

    const created = await this.save(
      workspaceToCreate,
      {},
      { company_id: workspace.company_id, user: { id: userId, server_request: true } },
    );

    await this.applications.companyApplications.initWithDefaultApplications(
      created.entity.company_id,
      {
        company: { id: created.entity.company_id },
        user: { id: userId, server_request: true },
      },
    );

    return new CreateResult<Workspace>(TYPE, created.entity);
  }

  update?(
    pk: Partial<Pick<Workspace, "id">>,
    item: Workspace,
    context?: ExecutionContext,
  ): Promise<UpdateResult<Workspace>> {
    throw new Error("Method not implemented.");
  }

  @RealtimeSaved<Workspace>((workspace, context) => [
    {
      // FIXME: For now the room is defined at the company level
      // It meay be good to have a special room where just some users are receiving this event
      room: ResourcePath.get(getRoomName(workspace)),
      path: getWorkspacePath(workspace, context as WorkspaceExecutionContext),
    },
  ])
  async save<SaveOptions>(
    item: Partial<Workspace>,
    options?: SaveOptions & { logo_b64?: string },
    context?: WorkspaceExecutionContext,
  ): Promise<SaveResult<Workspace>> {
    let workspace = getWorkspaceInstance({
      ...item,
      ...{
        company_id: (context.user.server_request ? item.company_id : null) || context.company_id,
        name: "",
        dateAdded: Date.now(),
        isArchived: false,
        isDefault: false,
      },
    });

    if (item.id && !context?.user?.server_request) {
      // ON UPDATE
      workspace = await this.get({
        id: item.id,
        company_id: context.company_id,
      });

      if (!workspace) {
        throw new Error(`Unable to edit inexistent workspace ${item.id}`);
      }
    }

    const logoInternalPath = `/workspaces/${workspace.id}/thumbnail.png`;
    const logoPublicPath = `/internal/services/workspaces/v1/companies/${
      workspace.company_id
    }/workspaces/${workspace.id}/thumbnail?t=${new Date().getTime()}`;
    let logoPublicUrl = undefined;
    if (workspace.logo) {
      if (!item.logo || options.logo_b64) {
        await this.platformServices.storage.remove(logoInternalPath);
        workspace.logo = null;
      }
    }
    if (options.logo_b64) {
      var s = new Readable();
      s.push(Buffer.from(options.logo_b64.split(",").pop(), "base64"));
      s.push(null);
      await this.platformServices.storage.write(logoInternalPath, s);
      logoPublicUrl = logoPublicPath;
    }

    workspace = merge(workspace, {
      name: await this.getWorkspaceName(item.name, context.company_id, workspace.id),
      logo: logoPublicUrl || workspace.logo,
      isArchived: item.isArchived,
      isDefault: item.isDefault,
    });

    await this.workspaceRepository.save(workspace);

    if (!item.id && context.user.id) {
      await this.addUser(
        { id: workspace.id, company_id: workspace.company_id },
        { id: context.user.id },
        "moderator",
      );
    }

    if (!item.id) {
      this.platformServices.pubsub.publish("workspace:added", {
        data: {
          company_id: workspace.company_id,
          workspace_id: workspace.id,
        },
      });
    }

    return new SaveResult<Workspace>(
      TYPE,
      workspace,
      item.id ? OperationType.UPDATE : OperationType.CREATE,
    );
  }

  async thumbnail(workspaceId: string) {
    const logoInternalPath = `/workspaces/${workspaceId}/thumbnail.png`;
    const file = await this.platformServices.storage.read(logoInternalPath);
    return { file };
  }

  async delete(
    pk: Partial<Pick<Workspace, "id">>,
    context?: WorkspaceExecutionContext,
  ): Promise<DeleteResult<Workspace>> {
    const primaryKey: Workspace = merge(new Workspace(), {
      company_id: context.company_id,
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
    const pk = { company_id: context.company_id };

    return this.workspaceRepository.find(pk, { pagination });
  }

  async getAllForCompany(companyId: uuid): Promise<Workspace[]> {
    let allCompanyWorkspaces: Workspace[] = [];
    let nextPage: Pagination = new Pagination("", "100");
    do {
      const tmp = await this.workspaceRepository.find(
        { company_id: companyId },
        { pagination: nextPage },
      );
      nextPage = tmp.nextPage as Pagination;
      allCompanyWorkspaces = [...allCompanyWorkspaces, ...tmp.getEntities()];
    } while (nextPage.page_token);

    //Check there is at least one workspace in this company or enforce one
    if (allCompanyWorkspaces.length == 0) {
      const created = await this.create(
        getWorkspaceInstance({
          company_id: companyId,
          name: "Home",
          isDefault: true,
        }),
      );
      allCompanyWorkspaces.push(created.entity);
    }

    return allCompanyWorkspaces;
  }

  async addUser(
    workspacePk: WorkspacePrimaryKey,
    userPk: UserPrimaryKey,
    role: WorkspaceUserRole,
  ): Promise<void> {
    const wurPk = {
      workspaceId: workspacePk.id,
      userId: userPk.id,
    };

    const alreadyExists = await this.getUser(wurPk);
    if (!alreadyExists) {
      await this.userCounterIncrease(workspacePk.id, 1);
    }

    await this.workspaceUserRepository.save(
      getWorkspaceUserInstance({
        workspaceId: workspacePk.id,
        userId: userPk.id,
        role: role,
      }),
    );

    await this.platformServices.pubsub.publish("workspace:member:added", {
      data: {
        company_id: workspacePk.company_id,
        workspace_id: workspacePk.id,
        user_id: userPk.id,
      },
    });

    this;
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

  async checkWorkspaceHasOtherAdmin(workspaceUserPk: WorkspaceUserPrimaryKey): Promise<boolean> {
    //TODO: not implemented, we should check there is still an admin in the workspace before removal.
    // Note: company admin and owner are always workspace admins.
    return true;
  }

  async removeUser(
    workspaceUserPk: WorkspaceUserPrimaryKey,
  ): Promise<DeleteResult<WorkspaceUserPrimaryKey>> {
    const entity = await this.getUser(workspaceUserPk);

    if (!entity) {
      throw CrudExeption.notFound("WorkspaceUser entity not found");
    }

    if (!(await this.checkWorkspaceHasOtherAdmin(workspaceUserPk))) {
      throw CrudExeption.notFound("No other admin found in workspace");
    }

    await this.workspaceUserRepository.remove(entity);
    await this.userCounterIncrease(workspaceUserPk.workspaceId, -1);
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

  async processPendingUser(user: User): Promise<void> {
    const userCompanies = await this.companies.getAllForUser(user.id);
    for (const userCompany of userCompanies) {
      const workspaces = await this.getAllForCompany(userCompany.group_id);
      for (const workspace of workspaces) {
        const pendingUserPk = {
          workspace_id: workspace.id,
          email: user.email_canonical,
        };
        const pendingUser = await this.getPendingUser(pendingUserPk);

        if (pendingUser) {
          await this.removePendingUser(pendingUserPk);
          await this.addUser(
            { id: workspace.id, company_id: workspace.company_id },
            { id: user.id },
            pendingUser.role,
          );
        }
      }
    }
  }

  async getAllForUser(
    userId: Pick<WorkspaceUserPrimaryKey, "userId">,
    companyId: CompanyPrimaryKey,
  ): Promise<WorkspaceUser[]> {
    //Process pending invitation to workspace for this user
    const user = await this.users.get({ id: userId.userId });
    await this.processPendingUser(user);

    //Get all workspaces for this user
    const allCompanyWorkspaces = await this.getAllForCompany(companyId.id);
    const userWorkspaces = (
      await Promise.all(
        allCompanyWorkspaces.map(workspace =>
          this.workspaceUserRepository.findOne({
            user_id: userId.userId,
            workspace_id: workspace.id,
          }),
        ),
      )
    ).filter(uw => uw);

    //If user is in no workspace, then it must be invited in the default workspaces, expect if he's guest
    if (userWorkspaces.length === 0) {
      for (const workspace of allCompanyWorkspaces) {
        if (workspace.isDefault && !workspace.isArchived && !workspace.isDeleted) {
          try {
            //Role will match the company role in the default workspaces
            const companyRole = await this.companies.getCompanyUser(
              { id: companyId.id },
              { id: userId.userId },
            );
            let role: WorkspaceUserRole = "member";
            if (companyRole.role == "admin" || companyRole.role == "owner") role = "moderator";

            if (companyRole.role !== "guest") {
              await this.addUser(workspace, { id: userId.userId }, role);
              const uw = await this.workspaceUserRepository.findOne({
                user_id: userId.userId,
                workspace_id: workspace.id,
              });
              if (uw) {
                userWorkspaces.push(uw);
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    }

    return userWorkspaces;
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
  private async getWorkspaceName(exceptedName: string, companyId: string, workspaceId: string) {
    const workspacesList = await this.list(
      null,
      {},
      { company_id: companyId, user: { id: null, server_request: true } },
    );

    workspacesList.filterEntities(
      entity => entity.id !== workspaceId && _.includes(entity.name, exceptedName),
    );

    const shouldRenameWorkspace = !workspacesList.isEmpty();
    const duplicatesCount = workspacesList.getEntities().length;

    return shouldRenameWorkspace ? `${exceptedName}(${duplicatesCount + 1})` : exceptedName;
  }

  private wsCountPk = (id: string) => ({ id, counter_type: "members" });

  private userCounterIncrease(workspaceId: string, increaseValue: number) {
    return this.workspaceCounter.increase(this.wsCountPk(workspaceId), increaseValue);
  }

  getUsersCount(workspaceId: string): Promise<number> {
    return this.workspaceCounter.get(this.wsCountPk(workspaceId));
  }

  async getInviteToken(
    companyId: string,
    workspaceId: string,
  ): Promise<WorkspaceInviteTokenObject> {
    const pk = { company_id: companyId, workspace_id: workspaceId };
    const res = await this.workspaceInviteTokensRepository.findOne(pk);
    if (!res) return null;

    return {
      token: this.encodeInviteToken(companyId, workspaceId, res.invite_token),
    };
  }

  async createInviteToken(
    companyId: string,
    workspaceId: string,
  ): Promise<WorkspaceInviteTokenObject> {
    await this.deleteInviteToken(companyId, workspaceId);
    const token = randomBytes(32).toString("base64");
    const pk = { company_id: companyId, workspace_id: workspaceId };
    await this.workspaceInviteTokensRepository.save(
      getWorkspaceInviteTokensInstance({ ...pk, invite_token: token }),
    );
    return {
      token: this.encodeInviteToken(companyId, workspaceId, token),
    };
  }

  async deleteInviteToken(companyId: string, workspaceId: string): Promise<boolean> {
    const pk = { company_id: companyId, workspace_id: workspaceId };
    const currentRecord = await this.workspaceInviteTokensRepository.findOne(pk);
    if (currentRecord) {
      await this.workspaceInviteTokensRepository.remove(currentRecord);
    }
    return !!currentRecord;
  }

  async getInviteTokenInfo(encodedToken: string): Promise<WorkspaceInviteTokens> {
    let tokenInfo: InviteTokenObject;
    try {
      tokenInfo = this.decodeInviteToken(encodedToken);
    } catch (e) {}

    if (!tokenInfo) {
      return null;
    }

    const pk: WorkspaceInviteTokensPrimaryKey = {
      company_id: tokenInfo.c,
      workspace_id: tokenInfo.w,
      invite_token: tokenInfo.t,
    };
    return this.workspaceInviteTokensRepository.findOne(pk);
  }

  public encodeInviteToken(companyId: string, workspaceId: string, token: string) {
    return `${reduceUUID4(companyId)}-${reduceUUID4(workspaceId)}-${token}}`;
  }

  public decodeInviteToken(encodedToken: string): InviteTokenObject {
    try {
      const [companyId, workspaceId, token] = encodedToken.split("-");
      return { c: expandUUID4(companyId), w: expandUUID4(workspaceId), t: token };
    } catch (e) {
      return { c: "", w: "", t: "" };
    }
  }
}
