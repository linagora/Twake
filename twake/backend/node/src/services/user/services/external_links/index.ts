import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import ExternalUser from "../../entities/external_user";
import ExternalGroup from "../../entities/external_company";
import { UserExternalLinksService } from "../../api";
import Company from "../../entities/company";
import User from "../../entities/user";
import gr from "../../../global-resolver";

export class UserExternalLinksServiceImpl implements UserExternalLinksService {
  version: "1";
  private externalUserRepository: Repository<ExternalUser>;
  private externalGroupRepository: Repository<ExternalGroup>;
  private companyRepository: Repository<Company>;
  private userRepository: Repository<User>;

  async init(): Promise<this> {
    this.externalUserRepository = await gr.database.getRepository<ExternalUser>(
      "external_user_repository",
      ExternalUser,
    );
    this.externalGroupRepository = await gr.database.getRepository<ExternalGroup>(
      "external_group_repository",
      ExternalGroup,
    );
    this.companyRepository = await gr.database.getRepository<Company>("group_entity", Company);
    this.userRepository = await gr.database.getRepository<User>("user", User);

    return this;
  }

  async createExternalUser(user: ExternalUser): Promise<ExternalUser> {
    await this.externalUserRepository.save(user);

    //Save user provider and provider id here
    const internalUser = await this.userRepository.findOne({ id: user.user_id });
    if (internalUser) {
      internalUser.identity_provider = user.service_id;
      internalUser.identity_provider_id = user.external_id;
      this.userRepository.save(internalUser);
    }

    return user;
  }

  async createExternalGroup(group: ExternalGroup): Promise<ExternalGroup> {
    await this.externalGroupRepository.save(group);

    //Save company provider and provider id here
    const internalCompany = await this.companyRepository.findOne({ id: group.company_id });
    if (internalCompany) {
      internalCompany.identity_provider = group.service_id;
      internalCompany.identity_provider_id = group.external_id;
      this.companyRepository.save(internalCompany);
    }

    return group;
  }
}
