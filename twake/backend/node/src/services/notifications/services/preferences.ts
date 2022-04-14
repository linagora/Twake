import { UserNotificationPreferencesAPI } from "../api";
import {
  CrudException,
  DeleteResult,
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

export class NotificationPreferencesService implements UserNotificationPreferencesAPI {
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

  async get(pk: UserNotificationPreferencesPrimaryKey): Promise<UserNotificationPreferences> {
    return await this.repository.findOne(pk);
  }

  async delete(
    pk: UserNotificationPreferencesPrimaryKey,
  ): Promise<DeleteResult<UserNotificationPreferences>> {
    await this.repository.remove(pk as UserNotificationPreferences);

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
  ): Promise<ListResult<UserNotificationPreferences>> {
    if (!workspace_id || !company_id || !user_id) {
      throw CrudException.badRequest("workspace_id, company_id and user_id are required");
    }

    return await this.repository.find({
      workspace_id,
      company_id,
      user_id,
      ...pick(filter, ["user_id"]),
    });
  }

  async savePreferences(
    notificationPreferences: UserNotificationPreferences,
  ): Promise<SaveResult<UserNotificationPreferences>> {
    const notificationPreferencesEntity = new UserNotificationPreferences();
    assign(notificationPreferencesEntity, notificationPreferences);

    await this.repository.save(notificationPreferencesEntity);

    return new SaveResult(
      UserNotificationPreferencesType,
      notificationPreferences,
      OperationType.CREATE,
    );
  }
}
