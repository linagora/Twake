import { Initializable, TwakeServiceProvider } from "../../core/platform/framework";
import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
} from "../../core/platform/framework/api/crud-service";
import Workspace, { WorkspacePrimaryKey } from "./entities/workspace";
import WorkspaceUser, { WorkspaceUserPrimaryKey } from "../workspaces/entities/workspace_user";
import { Observable } from "rxjs";
import User, { UserPrimaryKey } from "../user/entities/user";
import { WorkspaceUserRole } from "./types";
import { CompanyPrimaryKey } from "../user/entities/company";
import WorkspacePendingUser, {
  WorkspacePendingUserPrimaryKey,
} from "./entities/workspace_pending_users";
import { CompanyUserRole } from "../user/web/types";
import { uuid } from "../../utils/types";
import { InviteTokenObject, WorkspaceInviteTokenObject } from "./web/types";
import WorkspaceInviteTokens from "./entities/workspace_invite_tokens";
import { Readable } from "stream";

export interface WorkspaceService
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

  getUsersCount(workspaceId: string): Promise<number>;

  processPendingUser(user: User): Promise<void>;

  thumbnail(workspaceId: string): Promise<{ file: Readable }>;

  removeUser(
    workspaceUserPk: WorkspaceUserPrimaryKey,
    companyId: string,
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

  getInviteToken(
    companyId: string,
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceInviteTokenObject>;
  createInviteToken(
    companyId: string,
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceInviteTokenObject>;
  deleteInviteToken(companyId: string, workspaceId: string, userId: string): Promise<boolean>;
  getInviteTokenInfo(jwtToken: string): Promise<WorkspaceInviteTokens>;

  encodeInviteToken(companyId: string, workspaceId: string, userId: string, token: string): string;
  decodeInviteToken(encodedToken: string): InviteTokenObject;

  ensureUserNotInCompanyIsNotInWorkspace(userPk: UserPrimaryKey, companyId: string): Promise<void>;
}
