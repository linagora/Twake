import {
  CrudException,
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import {
  UserNotificationPreferences,
  UserNotificationPreferencesPrimaryKey,
  UserNotificationPreferencesType,
} from "../entities";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { assign, pick } from "lodash";
import gr from "../../global-resolver";
import { Initializable, TwakeServiceProvider } from "../../../core/platform/framework";
import _ from "lodash";

export class NotificationPreferencesService implements TwakeServiceProvider, Initializable {
  version: "1";
  repository: Repository<UserNotificationPreferences>;

  async init(): Promise<this> {
    this.repository = await gr.database.getRepository<UserNotificationPreferences>(
      UserNotificationPreferencesType,
      UserNotificationPreferences,
    );

    return this;
  }

  async list(): Promise<ListResult<UserNotificationPreferences>> {
    throw new Error("Not implemented");
  }

  async get(
    pk: UserNotificationPreferencesPrimaryKey,
    context?: ExecutionContext,
  ): Promise<UserNotificationPreferences> {
    return await this.repository.findOne(pk, {}, context);
  }

  /** We can define preferences for specifically a workspace or for all a company or all Twake
   * This function will ensure we get all with inherit and all
   */
  async getMerged(pk: UserNotificationPreferencesPrimaryKey): Promise<UserNotificationPreferences> {
    let preferences = await this.get(pk);
    if (pk.workspace_id !== "all")
      preferences = _.merge(await this.get({ ...pk, workspace_id: "all" }), preferences);
    if (pk.company_id !== "all")
      preferences = _.merge(
        await this.get({ ...pk, workspace_id: "all", company_id: "all" }),
        preferences,
      );
    return preferences;
  }

  async delete(
    pk: UserNotificationPreferencesPrimaryKey,
    context?: ExecutionContext,
  ): Promise<DeleteResult<UserNotificationPreferences>> {
    await this.repository.remove(pk as UserNotificationPreferences, context);

    return new DeleteResult(
      UserNotificationPreferencesType,
      pk as UserNotificationPreferences,
      true,
    );
  }

  async listPreferences(
    workspace_id: string,
    company_id: string,
    user_id: string,
    filter: Pick<UserNotificationPreferencesPrimaryKey, "user_id">,
    context?: ExecutionContext,
  ): Promise<ListResult<UserNotificationPreferences>> {
    if (!workspace_id || !company_id || !user_id) {
      throw CrudException.badRequest("workspace_id, company_id and user_id are required");
    }

    return await this.repository.find(
      {
        workspace_id,
        company_id,
        user_id,
        ...pick(filter, ["user_id"]),
      },
      {},
      context,
    );
  }

  async savePreferences(
    notificationPreferences: UserNotificationPreferences,
    context: ExecutionContext,
  ): Promise<SaveResult<UserNotificationPreferences>> {
    const notificationPreferencesEntity = new UserNotificationPreferences();
    assign(notificationPreferencesEntity, notificationPreferences);

    await this.repository.save(notificationPreferencesEntity, context);

    return new SaveResult(
      UserNotificationPreferencesType,
      notificationPreferences,
      OperationType.CREATE,
    );
  }
}
