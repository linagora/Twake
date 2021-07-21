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

import { v1 as uuidv1 } from "uuid";
import CompanyUser from "../../src/services/user/entities/company_user";
import { DatabaseServiceAPI } from "../../src/core/platform/services/database/api";
import Repository from "../../src/core/platform/services/database/services/orm/repository/repository";
import { memoize } from "lodash";
import Device from "../../src/services/user/entities/device";

export type uuid = string;

export class TestDbService {
  private deviceRepository: Repository<Device>;
  public static async getInstance(testPlatform: TestPlatform): Promise<TestDbService> {
    const instance = new this(testPlatform);
    await instance.init();
    return instance;
  }

  public company: Company;
  public users: User[];
  private workspacesMap: Map<string, { workspace: Workspace; users: User[] }>;
  private userService;

  rand = () => Math.floor(Math.random() * 100000);
  private database: DatabaseServiceAPI;

  private companyUserRepository: Repository<CompanyUser>;
  private userRepository: Repository<User>;

  constructor(protected testPlatform: TestPlatform) {
    this.userService = this.testPlatform.platform.getProvider<UserServiceAPI>("user");
    this.database = this.testPlatform.platform.getProvider<DatabaseServiceAPI>("database");
    this.users = [];
    this.workspacesMap = new Map<string, { workspace: Workspace; users: User[] }>();
  }

  private async init() {
    this.userRepository = await this.database.getRepository<User>("user", User);
    this.companyUserRepository = await this.database.getRepository<CompanyUser>(
      "group_user",
      CompanyUser,
    );
    this.deviceRepository = await this.database.getRepository<Device>("device", Device);
  }
  public get workspaces() {
    return [...this.workspacesMap.values()];
  }

  async createCompany(id: uuid): Promise<void> {
    const name = `TwakeAutotests-test-company-${this.rand()}`;
    this.company = await this.userService.companies.createCompany(
      getCompanyInstance({
        id: id,
        name: name,
        displayName: name,
        identity_provider_id: id,
      }),
    );
  }

  async createWorkspace(workspacePk: WorkspacePrimaryKey): Promise<Workspace> {
    const name = `TwakeAutotests-test-workspace-${this.rand()}`;
    const workspace = await this.userService.workspaces.create(
      getWorkspaceInstance({
        id: workspacePk.id,
        name: name,
        logo: "workspace_logo",
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

    const createdWorkspaceEntity = workspace.entity;
    this.workspacesMap.set(createdWorkspaceEntity.id, {
      workspace: createdWorkspaceEntity,
      users: [],
    });
    return createdWorkspaceEntity;
  }

  async createUser(
    workspacesPk?: Array<WorkspacePrimaryKey>,
    options: {
      companyRole?: "member" | "admin" | "guest";
      workspaceRole?: "member" | "admin";
      firstName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      password?: string;
      cache?: User["cache"];
    } = {},
  ): Promise<User> {
    const user = new User();
    const random = this.rand();
    user.id = uuidv1();
    user.username_canonical = options.username || `test${random}`;
    user.first_name = options.firstName || `test${random}_first_name`;
    user.last_name = options.lastName || `test${random}_last_name`;
    user.email_canonical = options.email || `test${random}@twake.app`;
    user.identity_provider_id = user.id;
    user.cache = options.cache || user.cache;

    if (options.email) {
      user.email_canonical = options.email;
    }
    const createdUser = await this.userService.users.create(user).then(a => a.entity);

    if (options.password) {
      await this.userService.users.setPassword({ id: createdUser.id }, options.password);
    }

    this.users.push(createdUser);
    await this.userService.companies.setUserRole(
      this.company.id,
      createdUser.id,
      options.companyRole ? options.companyRole : "member",
    );

    if (workspacesPk && workspacesPk.length) {
      for (const workspacePk of workspacesPk) {
        await this.userService.workspaces.addUser(
          workspacePk,
          { id: createdUser.id },
          options.workspaceRole ? options.workspaceRole : "member",
        );
        const wsContainer = this.workspacesMap.get(workspacePk.id);
        wsContainer.users.push(createdUser);
      }
    }

    return createdUser;
  }

  async getUserFromDb(user: Partial<Pick<User, "id" | "identity_provider_id">>): Promise<User> {
    if (user.id) {
      return this.userService.users.get({ id: user.id });
    } else if (user.identity_provider_id) {
      return this.userService.users.getByConsoleId(user.identity_provider_id);
    } else {
      throw new Error("getUserFromDb: Id not provided");
    }
  }

  async getDeviceFromDb(id: string): Promise<Device> {
    return this.deviceRepository.findOne({ id });
  }

  getCompanyFromDb(companyId: uuid) {
    return this.userService.companies.getCompany({ id: companyId });
  }

  getCompanyFromDbByCode(code: uuid) {
    return this.userService.companies.getCompany({ identity_provider_id: code });
  }

  async getCompanyUsers(companyId: uuid): Promise<User[]> {
    const allUsers = await this.userRepository.find({}).then(a => a.getEntities());

    const companyUsers: User[] = [];

    for (const user of allUsers) {
      const userInCompany = await this.companyUserRepository.findOne({
        user_id: user.id,
        group_id: companyId,
      });
      if (userInCompany) {
        companyUsers.push(user);
      }
    }
    return companyUsers;
  }

  getCompanyUser(companyId: uuid, userId: uuid): Promise<CompanyUser> {
    return this.userService.companies.getCompanyUser({ id: companyId }, { id: userId });
  }
}
