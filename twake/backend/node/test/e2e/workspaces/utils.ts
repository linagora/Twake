import { TestPlatform } from "../setup";
import UserServiceAPI from "../../../src/services/user/api";
import User from "../../../src/services/user/entities/user";
import { v1 as uuid } from "uuid";
import Company, {
  getInstance as getCompanyInstance,
} from "../../../src/services/user/entities/company";
import Workspace, {
  getInstance as getWorkspaceInstance,
  WorkspacePrimaryKey,
} from "../../../src/services/workspaces/entities/workspace";

export class TestUsers {
  public company: Company;
  public users: User[];
  public workspaces: Workspace[];
  private userService;

  constructor(protected testPlatform: TestPlatform) {
    this.userService = this.testPlatform.platform.getProvider<UserServiceAPI>("user");
    this.users = [];
    this.workspaces = [];
  }

  async createCompany(): Promise<void> {
    this.company = await this.userService.companies.createCompany(
      getCompanyInstance({
        id: "21111111-1111-1111-1111-111111111111",
        name: "TwakeAutotests-test-company",
        displayName: "TwakeAutotests-test-company",
      }),
    );
  }

  async createWorkspace(): Promise<Workspace> {
    if (!this.company || !this.company.id) {
      throw new Error("Company is not defined");
    }
    const rand = Math.floor(Math.random() * 100000);

    const workspaceId = "31111111-1111-1111-1111-111111111111";

    const workspace = await this.userService.workspaces.create(
      getWorkspaceInstance({
        id: workspaceId,
        name: `TwakeAutotests-test-workspace-${rand}`,
        group_id: this.company.id,
      }),
    );

    const createdWorkspace = await this.userService.workspaces.get({
      id: workspaceId,
      group_id: this.company.id,
    });

    if (!createdWorkspace) {
      throw new Error("workspace wasn't created");
    }

    this.workspaces.push(workspace.entity);
    return workspace.entity;
  }

  async createUser(workspacesPk?: Array<WorkspacePrimaryKey>): Promise<User> {
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

  private disabled = true;

  async deleteAll(): Promise<void> {
    if (this.disabled) return;
    await Promise.all(
      this.users.map(async user => {
        await this.userService.users.delete({ id: user.id });
        for (const workspace of this.workspaces) {
          await this.userService.workspaces.removeUser({ id: workspace.id }, { id: user.id });
        }
        await this.userService.companies.removeUserFromCompany(this.company, { id: user.id });
      }),
    );

    await this.userService.companies.delete({ id: this.company.id });
    this.company = null;
  }

  async createCompanyAndUsers(): Promise<void> {
    await this.createCompany();
    await this.createWorkspace();
    await this.createUser(this.workspaces);
    await this.createUser(this.workspaces);
  }
}
