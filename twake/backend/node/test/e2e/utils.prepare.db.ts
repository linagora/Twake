import { TestPlatform } from "./setup";
import UserServiceAPI from "./../../src/services/user/api";
import User from "./../../src/services/user/entities/user";
import Company, {
  getInstance as getCompanyInstance,
} from "./../../src/services/user/entities/company";
import Workspace, {
  getInstance as getWorkspaceInstance,
  WorkspacePrimaryKey,
} from "./../../src/services/workspaces/entities/workspace";

export type uuid = string;

export class TestDbService {
  public company: Company;
  public users: User[];
  public workspaces: Workspace[];
  private userService;

  rand = () => Math.floor(Math.random() * 100000);

  constructor(protected testPlatform: TestPlatform) {
    this.userService = this.testPlatform.platform.getProvider<UserServiceAPI>("user");
    this.users = [];
    this.workspaces = [];
  }

  // "21111111-1111-1111-1111-111111111111"

  async createCompany(id: uuid): Promise<void> {
    const name = `TwakeAutotests-test-company-${this.rand()}`;
    this.company = await this.userService.companies.createCompany(
      getCompanyInstance({
        id: id,
        name: name,
        displayName: name,
      }),
    );
  }

  // "31111111-1111-1111-1111-111111111111"

  async createWorkspace(workspacePk: WorkspacePrimaryKey): Promise<Workspace> {
    const name = `TwakeAutotests-test-workspace-${this.rand()}`;
    const workspace = await this.userService.workspaces.create(
      getWorkspaceInstance({
        id: workspacePk.id,
        name: name,
        group_id: workspacePk.group_id,
      }),
    );

    const createdWorkspace = await this.userService.workspaces.get({
      id: workspacePk.id,
      group_id: workspacePk.group_id,
    });

    if (!createdWorkspace) {
      throw new Error("workspace wasn't created");
    }

    this.workspaces.push(workspace.entity);
    return workspace.entity;
  }

  async createUser(workspacesPk?: Array<WorkspacePrimaryKey>): Promise<User> {
    const user = new User();
    const random = this.rand();
    user.username_canonical = `test${random}`;
    user.first_name = `test${random}_first_name`;
    user.last_name = `test${random}_last_name`;
    const createdUser = await this.userService.users.create(user);
    this.users.push(createdUser.entity);
    await this.userService.companies.addUserInCompany(this.company, createdUser.entity);
    await this.userService.companies.setUserRole(
      { id: this.company.id },
      { id: createdUser.entity.id },
      "member",
    );

    if (workspacesPk && workspacesPk.length) {
      for (const workspacePk of workspacesPk) {
        await this.userService.workspaces.addUser(
          workspacePk,
          { id: createdUser.entity.id },
          "member",
        );
      }
    }

    return createdUser.entity;
  }

  // async deleteAll(): Promise<void> {
  //   await Promise.all(
  //     this.users.map(async user => {
  //       await this.userService.users.delete({ id: user.id });
  //       for (const workspace of this.workspaces) {
  //         await this.userService.workspaces.removeUser({ id: workspace.id }, { id: user.id });
  //       }
  //       await this.userService.companies.removeUserFromCompany(this.company, { id: user.id });
  //     }),
  //   );
  //
  //   await this.userService.companies.delete({ id: this.company.id });
  //   this.company = null;
  // }
}
