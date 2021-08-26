import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PhpWorkspace, TYPE as phpTYPE } from "./php-workspace/php-workspace-entity";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import Workspace, { TYPE, getInstance } from "../../../services/workspaces/entities/workspace";

type Options = {
  from?: string;
  onlyCompany?: string;
  onlyWorkspace?: string;
};

class WorkspaceMigrator {
  database: DatabaseServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options: Options = {}): Promise<void> {
    const phpRepository = await this.database.getRepository(phpTYPE, PhpWorkspace);
    const repository = await this.database.getRepository(TYPE, Workspace);

    let waitForCompany = false;
    if (options.from) {
      waitForCompany = true;
    }

    // Get all companies
    let page: Pagination = { limitStr: "100" };
    // For each companies find workspaces
    do {
      const workspaceListResult = await phpRepository.find({});
      page = workspaceListResult.nextPage as Pagination;

      for (const workspace of workspaceListResult.getEntities()) {
        if (waitForCompany && options.from == `${workspace.group_id}`) {
          waitForCompany = false;
        }

        if (!waitForCompany) {
          if (
            (!options.onlyCompany && !options.onlyWorkspace) ||
            options.onlyCompany == `${workspace.group_id}`
          ) {
            const newWorkspace = getInstance(workspace);
            newWorkspace.company_id = workspace.group_id;
            repository.save(newWorkspace);
          }
        }
      }
    } while (page.page_token);
  }
}

const services = [
  "user",
  "search",
  "channels",
  "database",
  "webserver",
  "pubsub",
  "workspaces",
  "console",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "workspace",
  describe: "command that allow you to migrate php workspaces to node",
  builder: {
    from: {
      default: null,
      type: "string",
      description: "Start migration from this workspace ID",
    },
    onlyCompany: {
      default: null,
      type: "string",
      description: "Migrate only this workspace ID",
    },
    onlyWorkspace: {
      default: null,
      type: "string",
      description: "Migrate only this workspace ID",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php messages - " }).start();
    const platform = await twake.run(services);
    const migrator = new WorkspaceMigrator(platform);

    const from = argv.from as string | null;
    const onlyCompany = argv.onlyCompany as string | null;
    const onlyWorkspace = argv.onlyWorkspace as string | null;

    await migrator.run({
      from,
      onlyCompany,
      onlyWorkspace,
    });

    return spinner.stop();
  },
};

export default command;
