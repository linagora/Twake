import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import _ from "lodash";
import User, { TYPE as UserTYPE } from "../../../services/user/entities/user";
import Application, {
  TYPE as ApplicationTYPE,
} from "../../../services/applications/entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { SearchServiceAPI } from "../../../core/platform/services/search/api";

type Options = {
  repository?: string;
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
    repositories.set("users", await this.database.getRepository(UserTYPE, User));
    repositories.set(
      "applications",
      await this.database.getRepository(ApplicationTYPE, Application),
    );

    const repository = repositories.get(options.repository);
    if (!repository) {
      throw `No such repository ready for indexation, available are: users, applications`;
    }

    // Get all companies
    let page: Pagination = { limitStr: "100" };
    // For each devices
    do {
      const list = await repository.find({}, { pagination: page });
      page = list.nextPage as Pagination;

      for (const item of list.getEntities()) {
        await this.search.upsert(item);
      }

      await new Promise(r => setTimeout(r, 200));
    } while (page.page_token);
  }
}

const services = ["search", "database", "webserver", "pubsub", "workspaces", "console", "auth"];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "index",
  describe: "command to reindex search middleware from db entities",
  builder: {
    repository: {
      default: "",
      type: "string",
      description: "Choose a repository to reindex",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Reindex repository - " }).start();
    const platform = await twake.run(services);
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
