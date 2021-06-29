import { Initializable, TwakeServiceProvider } from "../../core/platform/framework";
import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
} from "../../core/platform/framework/api/crud-service";
import Workspace, { WorkspacePrimaryKey } from "./entities/workspace";
import UserServiceAPI, { CompaniesServiceAPI, UsersServiceAPI } from "../user/api";
import WorkspaceUser, { WorkspaceUserPrimaryKey } from "../workspaces/entities/workspace_user";
import { Observable } from "rxjs";
import { UserPrimaryKey } from "../user/entities/user";
import { WorkspaceUserRole } from "./types";
import { CompanyPrimaryKey } from "../user/entities/company";
import WorkspacePendingUser, {
  WorkspacePendingUserPrimaryKey,
} from "./entities/workspace_pending_users";
import { CompanyUserRole } from "../user/web/types";
import { uuid } from "../../utils/types";
import { ConsoleServiceAPI } from "../console/api";

export default interface WorkspaceServicesAPI extends TwakeServiceProvider, Initializable {
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;
  console: ConsoleServiceAPI;
}

export interface WorkspaceServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Workspace, WorkspacePrimaryKey, ExecutionContext> {
  addUser(
    workspacePk: WorkspacePrimaryKey,
    userPk: UserPrimaryKey,
    role: WorkspaceUserRole,
  ): Promise<void>;

  updateUserRole(workspaceUserPk: WorkspaceUserPrimaryKey, role: WorkspaceUserRole): Promise<void>;

  getAllForCompany(companyId: uuid): Promise<Workspace[]>;

  removeUser(
    workspaceUserPk: WorkspaceUserPrimaryKey,
  ): Promise<DeleteResult<WorkspaceUserPrimaryKey>>;

  /**
   * Get workspace users in the given workspace
   *
   * @param workspaceId
   * @param pagination
   */
  getUsers(
    workspaceId: Pick<WorkspaceUserPrimaryKey, "workspaceId">,
    pagination?: Paginable,
  ): Promise<ListResult<WorkspaceUser>>;

  /**
   * Get workspace user in the given workspace
   *
   * @param workspaceId
   * @param userId
   */
  getUser(
    workspaceUserPk: Pick<WorkspaceUserPrimaryKey, "workspaceId" | "userId">,
  ): Promise<WorkspaceUser>;

  /**
   * Get all the workspace for a user
   *
   * @param userId
   * @param userId
   */
  getAllForUser(
    userId: Pick<WorkspaceUserPrimaryKey, "userId">,
    companyId: CompanyPrimaryKey,
  ): Promise<WorkspaceUser[]>;

  /**
   * Get all the users of a workspace as Observable
   *
   * @param workspaceId
   */
  getAllUsers$(
    workspaceId: Pick<WorkspaceUserPrimaryKey, "workspaceId">,
  ): Observable<WorkspaceUser>;

  /**
   * Paginate over all the users of a workspace
   *
   * @param workspaceId
   * @param pagination
   */
  getAllUsers$(
    workspaceId: Pick<WorkspaceUserPrimaryKey, "workspaceId">,
    pagination: Paginable,
  ): Observable<WorkspaceUser>;

  addPendingUser(
    workspacePk: WorkspacePendingUserPrimaryKey,
    workspaceRole: WorkspaceUserRole,
    companyRole: CompanyUserRole,
  ): Promise<void>;

  getPendingUser(primaryKey: WorkspacePendingUserPrimaryKey): Promise<WorkspacePendingUser>;

  getPendingUsers(
    workspaceId: Pick<WorkspacePendingUserPrimaryKey, "workspace_id">,
  ): Promise<WorkspacePendingUser[]>;

  removePendingUser(
    workspaceUserPk: WorkspacePendingUserPrimaryKey,
  ): Promise<DeleteResult<WorkspacePendingUserPrimaryKey>>;
}
