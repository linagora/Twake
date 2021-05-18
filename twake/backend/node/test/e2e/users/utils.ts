import { TestPlatform } from "../setup";
import UserServiceAPI from "../../../src/services/user/api";
import User from "../../../src/services/user/entities/user";
import { v1 as uuid } from "uuid";
import Company, {
  getInstance as getCompanyInstance,
} from "../../../src/services/user/entities/company";

export class TestUsers {
  private company: Company;
  public users: User[];
  private userService;

  constructor(protected testPlatform: TestPlatform) {
    this.userService = this.testPlatform.platform.getProvider<UserServiceAPI>("user");
    this.users = [];
  }

  async createCompany() {
    this.company = await this.userService.companies.createCompany(
      getCompanyInstance({
        id: uuid(),
        name: "TwakeAutotests-test-company",
        displayName: "TwakeAutotests-test-company",
      }),
    );
  }

  async createUser(): Promise<User> {
    const rand = Math.floor(Math.random() * 100000);
    const user = new User();
    user.username_canonical = `test${rand}`;
    user.first_name = `test${rand}_first_name`;
    user.last_name = `test${rand}_last_name`;
    const createdUser = await this.userService.users.create(user);
    this.users.push(createdUser.entity);
    await this.userService.companies.addUserInCompany(this.company, createdUser.entity);
    await this.userService.companies.setUserRole(
      { id: this.company.id },
      { id: createdUser.entity.id },
      "member",
    );
    return createdUser.entity;
  }

  async deleteAll(): Promise<void> {
    await Promise.all(
      this.users.map(async user => {
        await this.userService.users.delete({ id: user.id });
        await this.userService.companies.removeUserFromCompany(this.company, { id: user.id });
      }),
    );

    await this.userService.companies.delete({ id: this.company.id });
    this.company = null;
  }

  async createCompanyAndUsers(): Promise<void> {
    await this.createCompany();
    await this.createUser();
    await this.createUser();
  }
}
