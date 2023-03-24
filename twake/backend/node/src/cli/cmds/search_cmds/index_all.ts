import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { Pagination } from "../../../core/platform/framework/api/crud-service";

import User, { TYPE as UserTYPE } from "../../../services/user/entities/user";
import { Channel } from "../../../services/channels/entities";
import Application, {
  TYPE as ApplicationTYPE,
} from "../../../services/applications/entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { SearchServiceAPI } from "../../../core/platform/services/search/api";
import CompanyUser, { TYPE as CompanyUserTYPE } from "../../../services/user/entities/company_user";
import { Message, TYPE as MessageTYPE } from "../../../services/messages/entities/messages";
import gr from "../../../services/global-resolver";
import {
  MessageFile,
  TYPE as MessageFileTYPE,
} from "../../../services/messages/entities/message-files";

type Options = {
  repository?: string;
  repairEntities?: boolean;
};

class SearchIndexAll {
  database: DatabaseServiceAPI;
  search: SearchServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
    this.search = this.platform.getProvider<SearchServiceAPI>("search");
  }

  public async run(options: Options = {}): Promise<void> {
    const repositories: Map<string, Repository<any>> = new Map();
    repositories.set("messages", await this.database.getRepository(MessageTYPE, Message));
    repositories.set(
      "message_files",
      await this.database.getRepository(MessageFileTYPE, MessageFile),
    );
    repositories.set("users", await this.database.getRepository(UserTYPE, User));
    repositories.set("channels", await this.database.getRepository("channels", Channel));
    repositories.set(
      "applications",
      await this.database.getRepository(ApplicationTYPE, Application),
    );

    const repository = repositories.get(options.repository);
    if (!repository) {
      throw (
        "No such repository ready for indexation, available are: " +
        Array.from(repositories.keys()).join(", ")
      );
    }

    // Complete user with companies in cache
    if (options.repository === "users" && options.repairEntities) {
      console.log("Complete user with companies in cache");
      const companiesUsersRepository = await this.database.getRepository(
        CompanyUserTYPE,
        CompanyUser,
      );
      const userRepository = await this.database.getRepository(UserTYPE, User);
      let page: Pagination = { limitStr: "100" };
      // For each rows
      do {
        const list = await userRepository.find({}, { pagination: page }, undefined);

        for (const user of list.getEntities()) {
          const companies = await companiesUsersRepository.find(
            { user_id: user.id },
            {},
            undefined,
          );

          user.cache ||= { companies: [] };
          user.cache.companies = companies.getEntities().map(company => company.group_id);
          await repositories.get("users").save(user, undefined);
        }

        page = list.nextPage as Pagination;
        await new Promise(r => setTimeout(r, 200));
      } while (page.page_token);
    }

    console.log("Start indexing...");
    let count = 0;
    // Get all items
    let page: Pagination = { limitStr: "100" };
    do {
      console.log("Indexed " + count + " items...");
      const list = await repository.find({}, { pagination: page }, undefined);
      page = list.nextPage as Pagination;
      await this.search.upsert(list.getEntities());
      count += list.getEntities().length;
      await new Promise(r => setTimeout(r, 200));
    } while (page.page_token);

    console.log("Emptying flush (10s)...");
    await new Promise(r => setTimeout(r, 10000));

    console.log("Done!");
  }
}

const services = [
  "search",
  "database",
  "webserver",
  "auth",
  "counter",
  "cron",
  "message-queue",
  "push",
  "realtime",
  "storage",
  "tracker",
  "websocket",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "index",
  describe: "command to reindex search middleware from db entities",
  builder: {
    repository: {
      default: "",
      type: "string",
      description: "Choose a repository to reindex",
    },
    repairEntities: {
      default: false,
      type: "boolean",
      description: "Choose to repair entities too when possible",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Reindex repository - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new SearchIndexAll(platform);

    const repository = (argv.repository || "") as string;

    if (!repository) {
      throw "No repository was set.";
    }

    await migrator.run({
      repository,
    });

    return spinner.stop();
  },
};

export default command;
