import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import ExternalUser from "../../entities/external_user";
import ExternalGroup from "../../entities/external_company";
import { UserExternalLinksServiceAPI } from "../../api";

export class UserExternalLinksService implements UserExternalLinksServiceAPI {
  version: "1";
  private externalUserRepository: Repository<ExternalUser>;
  private externalGroupRepository: Repository<ExternalGroup>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.externalUserRepository = await this.database.getRepository<ExternalUser>(
      "external_user_repository",
      ExternalUser,
    );
    this.externalGroupRepository = await this.database.getRepository<ExternalGroup>(
      "external_group_repository",
      ExternalGroup,
    );

    return this;
  }

  async createExternalUser(user: ExternalUser): Promise<ExternalUser> {
    await this.externalUserRepository.save(user);

    return user;
  }

  async createExternalGroup(group: ExternalGroup): Promise<ExternalGroup> {
    await this.externalGroupRepository.save(group);

    return group;
  }
}

export function getService(databaseService: DatabaseServiceAPI): UserExternalLinksServiceAPI {
  return new UserExternalLinksService(databaseService);
}
