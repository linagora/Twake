/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CreateResult,
  CrudExeption,
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository, {
  FindFilter,
  FindOptions,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import { UsersServiceAPI } from "../../api";
import { ListUserOptions } from "./types";
import CompanyUser from "../../entities/company_user";
import ExternalUser, { getInstance as getExternalUserInstance } from "../../entities/external_user";
import Device, {
  getInstance as getDeviceInstance,
  TYPE as DeviceType,
} from "../../entities/device";
import crypto from "crypto";
import PasswordEncoder from "../../../../utils/password-encoder";
import assert from "assert";

export class UserService implements UsersServiceAPI {
  version: "1";
  repository: Repository<User>;
  companyUserRepository: Repository<CompanyUser>;
  extUserRepository: Repository<ExternalUser>;
  private deviceRepository: Repository<Device>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository<User>("user", User);
    this.companyUserRepository = await this.database.getRepository<CompanyUser>(
      "group_user",
      CompanyUser,
    );
    this.extUserRepository = await this.database.getRepository<ExternalUser>(
      "external_user_repository",
      ExternalUser,
    );

    this.deviceRepository = await this.database.getRepository<Device>(DeviceType, Device);

    return this;
  }

  private async updateExtRepository(user: User) {
    if (user.identity_provider_id) {
      const key = { service_id: user.identity_provider, external_id: user.identity_provider_id };
      const extUser = (await this.extUserRepository.findOne(key)) || getExternalUserInstance(key);
      extUser.user_id = user.id;
      await this.extUserRepository.save(extUser);
    }
  }

  private assignDefaults(user: User) {
    if (user.identity_provider_id && !user.identity_provider) user.identity_provider = "console";
    if (user.email_canonical) user.email_canonical = user.email_canonical.toLocaleLowerCase();
    if (user.username_canonical)
      user.username_canonical = user.username_canonical.toLocaleLowerCase();
  }

  async create(user: User): Promise<CreateResult<User>> {
    this.assignDefaults(user);
    await this.repository.save(user);
    await this.updateExtRepository(user);
    return new CreateResult("user", user);
  }

  update(pk: Partial<User>, item: User, context?: ExecutionContext): Promise<UpdateResult<User>> {
    throw new Error("Method not implemented.");
  }

  async save<SaveOptions>(
    user: User,
    options?: SaveOptions,
    context?: ExecutionContext,
  ): Promise<SaveResult<User>> {
    this.assignDefaults(user);
    await this.repository.save(user);
    await this.updateExtRepository(user);
    return new SaveResult("user", user, OperationType.UPDATE);
  }

  async delete(pk: Partial<User>, context?: ExecutionContext): Promise<DeleteResult<User>> {
    const instance = await this.repository.findOne(pk);
    if (instance) await this.repository.remove(instance);
    return new DeleteResult<User>("user", instance, !!instance);
  }

  async list(
    pagination: Pagination,
    options?: ListUserOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<User>> {
    const findFilter: FindFilter = {};
    const findOptions: FindOptions = {
      pagination,
    };

    if (options?.userIds) {
      findOptions.$in = [["id", options.userIds]];
    }

    return this.repository.find(findFilter, findOptions);
  }

  getByEmail(email: string): Promise<User> {
    return this.repository.findOne({ email_canonical: email });
  }

  getByEmails(emails: string[]): Promise<User[]> {
    return Promise.all(emails.map(email => this.getByEmail(email))).then(emails =>
      emails.filter(a => a),
    );
  }

  async get(pk: UserPrimaryKey): Promise<User> {
    return await this.repository.findOne(pk);
  }

  async getByConsoleId(id: string, service_id: string = "console"): Promise<User> {
    const extUser = await this.extUserRepository.findOne({ service_id, external_id: id });
    if (!extUser) {
      return null;
    }
    return this.repository.findOne({ id: extUser.user_id });
  }

  async getUserCompanies(pk: UserPrimaryKey): Promise<CompanyUser[]> {
    return await this.companyUserRepository.find({ user_id: pk.id }).then(a => a.getEntities());
  }

  async isEmailAlreadyInUse(email: string): Promise<boolean> {
    return this.repository.findOne({ email_canonical: email }).then(user => Boolean(user));
  }
  async getAvailableUsername(username: string): Promise<string> {
    const users = await this.repository.find({}).then(a => a.getEntities());

    if (!users.find(user => user.username_canonical == username.toLocaleLowerCase())) {
      return username;
    }

    let suitableUsername = null;

    for (let i = 1; i < 1000; i++) {
      const dynamicUsername = username + i;
      if (!users.find(user => user.username_canonical == dynamicUsername.toLocaleLowerCase())) {
        suitableUsername = dynamicUsername;
        break;
      }
    }
    return suitableUsername;
  }

  async getUserDevices(userPrimaryKey: UserPrimaryKey): Promise<Device[]> {
    const user = await this.get(userPrimaryKey);
    if (!user) {
      throw CrudExeption.notFound(`User ${userPrimaryKey} not found`);
    }
    if (!user.devices || user.devices.length == 0) {
      return [];
    }
    return Promise.all(user.devices.map(id => this.deviceRepository.findOne({ id }))).then(a =>
      a.filter(a => a),
    );
  }

  async registerUserDevice(
    userPrimaryKey: UserPrimaryKey,
    id: string,
    type: string,
    version: string,
  ): Promise<void> {
    await this.deregisterUserDevice(id);

    const user = await this.get(userPrimaryKey);
    if (!user) {
      throw CrudExeption.notFound(`User ${userPrimaryKey} not found`);
    }
    user.devices = user.devices || [];
    user.devices.push(id);

    await Promise.all([
      this.repository.save(user),
      this.deviceRepository.save(getDeviceInstance({ id, type, version, user_id: user.id })),
    ]);
  }

  async deregisterUserDevice(id: string): Promise<void> {
    const existedDevice = await this.deviceRepository.findOne({ id });

    if (existedDevice) {
      const user = await this.get({ id: existedDevice.user_id });
      user.devices = (user.devices || []).filter(d => d !== id);
      await Promise.all([this.deviceRepository.remove(existedDevice), this.repository.save(user)]);
    }
  }

  async setPassword(userPrimaryKey: UserPrimaryKey, password: string): Promise<void> {
    assert(password, "UserAPI.setPassword: Password is not defined");
    const passwordEncoder = new PasswordEncoder();
    const user = await this.get(userPrimaryKey);
    if (!user) {
      throw CrudExeption.notFound(`User ${userPrimaryKey.id} not found`);
    }
    user.password = await passwordEncoder.encodePassword(password);
    user.salt = null;
    await this.repository.save(user);
  }

  async getPassword(userPrimaryKey: UserPrimaryKey): Promise<[string, string]> {
    const user = await this.get(userPrimaryKey);
    if (!user) {
      throw CrudExeption.notFound(`User ${userPrimaryKey.id} not found`);
    }

    if (user.salt) {
      return [user.password, user.salt];
    }

    return [user.password, null];
  }
}
