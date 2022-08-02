import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PhpWorkspace, TYPE as phpTYPE } from "./php-workspace/php-workspace-entity";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import Workspace, { TYPE, getInstance } from "../../../services/workspaces/entities/workspace";
import _ from "lodash";
import { logger } from "../../../core/platform/framework";
import gr from "../../../services/global-resolver";

type Options = {
  from?: string;
  onlyCompany?: string;
  onlyWorkspace?: string;
  replaceExisting?: boolean;
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
      const workspaceListResult = await phpRepository.find({}, { pagination: page }, undefined);
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
            if (
              !(await repository.findOne(
                { company_id: workspace.group_id, id: workspace.id },
                {},
                undefined,
              )) ||
              options.replaceExisting
            ) {
              const newWorkspace = getInstance(
                _.pick(
                  workspace,
                  "id",
                  "company_id",
                  "name",
                  "logo",
                  "stats",
                  "is_deleted",
                  "is_archived",
                  "is_default",
                  "date_added",
                ),
              );
              newWorkspace.company_id = workspace.group_id;
              await repository.save(newWorkspace, undefined);
            }
          }
        }
      }
    } while (page.page_token);
  }
}

const services = [
  "storage",
  "counter",
  "platform-services",
  "applications",
  "user",
  "search",
  "channels",
  "database",
  "webserver",
  "message-queue",
  "workspaces",
  "console",
  "auth",
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
    replaceExisting: {
      default: false,
      type: "boolean",
      description: "Replace already migrated workspaces",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php worskpaces - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new WorkspaceMigrator(platform);

    const from = argv.from as string | null;
    const onlyCompany = argv.onlyCompany as string | null;
    const onlyWorkspace = argv.onlyWorkspace as string | null;
    const replaceExisting = (argv.replaceExisting || false) as boolean;

    await migrator.run({
      from,
      onlyCompany,
      onlyWorkspace,
      replaceExisting,
    });

    return spinner.stop();
  },
};

export default command;
