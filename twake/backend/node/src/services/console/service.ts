import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { MergeProcess } from "./processing/merge";
import { ConsoleOptions, ConsoleType, MergeProgress } from "./types";
import { ConsoleServiceClient } from "./client-interface";
import { ConsoleClientFactory } from "./client-factory";
import User from "../user/entities/user";
import gr from "../global-resolver";
import { Configuration, TwakeServiceProvider } from "../../core/platform/framework";
import assert from "assert";
import { ExecutionContext } from "../../core/platform/framework/api/crud-service";

export class ConsoleServiceImpl implements TwakeServiceProvider {
  version: "1";

  consoleType: ConsoleType;
  consoleOptions: ConsoleOptions;
  services: {
    database: DatabaseServiceAPI;
  };
  private configuration: Configuration;

  constructor(options?: ConsoleOptions) {
    this.consoleOptions = options;
  }

  async init(): Promise<this> {
    this.configuration = new Configuration("console");
    assert(this.configuration, "console configuration is missing");
    const type = this.configuration.get("type") as ConsoleType;
    assert(type, "console configuration type is not defined");

    const s = this.configuration.get(type) as ConsoleOptions;

    this.consoleOptions = {
      type: type,
      new_console: s.new_console,
      username: s.username,
      password: s.password,
      url: s.url,
      hook: {
        token: s.hook?.token,
        public_key: s.hook?.public_key,
      },
      disable_account_creation: s.disable_account_creation,
    };

    this.consoleOptions.type = type;
    this.consoleType = type;

    return this;
  }

  merge(
    baseUrl: string,
    concurrent: number = 1,
    dryRun: boolean = false,
    console: string = "console",
    link: boolean = true,
    client: string,
    secret: string,
    context?: ExecutionContext,
  ): MergeProgress {
    return new MergeProcess(this.services.database, dryRun, console, link, {
      type: "remote",
      username: client,
      password: secret,
      url: baseUrl,
    } as ConsoleOptions).merge(concurrent);
  }

  getClient(): ConsoleServiceClient {
    return ConsoleClientFactory.create(this);
  }

  async processPendingUser(user: User, context?: ExecutionContext): Promise<void> {
    await gr.services.workspaces.processPendingUser(user, null, context);
  }
}
