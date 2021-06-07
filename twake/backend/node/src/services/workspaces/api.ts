import { Initializable, TwakeServiceProvider } from "../../core/platform/framework";
import {
  CRUDService,
  ExecutionContext,
  ListResult,
  Paginable,
} from "../../core/platform/framework/api/crud-service";
import Workspace, { WorkspacePrimaryKey } from "./entities/workspace";
import { CompaniesServiceAPI } from "../user/api";
import WorkspaceUser, { WorkspaceUserPrimaryKey } from "../user/entities/workspace_user";
import { Observable } from "rxjs";
import { UserPrimaryKey } from "../user/entities/user";
import { WorkspaceUserRole } from "./types";
import { CompanyPrimaryKey } from "../user/entities/company";

export default interface WorkspaceServicesAPI extends TwakeServiceProvider, Initializable {
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
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

  removeUser(workspacePk: WorkspacePrimaryKey, userPk: UserPrimaryKey): Promise<void>;

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
    workspaceUser: Pick<WorkspaceUserPrimaryKey, "workspaceId" | "userId">,
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
}
