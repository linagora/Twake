import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import PhpApplication, {
  DepreciatedDisplayConfiguration,
  TYPE as phpTYPE,
} from "./php-application/php-application-entity";
import { ExecutionContext, Pagination } from "../../../core/platform/framework/api/crud-service";
import Application, {
  ApplicationPublication,
  TYPE,
} from "../../../services/applications/entities/application";
import gr from "../../../services/global-resolver";

type Options = {
  onlyApplication?: string;
  replaceExisting?: boolean;
};

class ApplicationMigrator {
  database: DatabaseServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options: Options = {}): Promise<void> {
    const phpRepository = await this.database.getRepository(phpTYPE, PhpApplication);
    const repository = await this.database.getRepository(TYPE, Application);

    let page: Pagination = { limitStr: "100" };
    do {
      const applicationListResult = await phpRepository.find({}, { pagination: page }, undefined);
      page = applicationListResult.nextPage as Pagination;

      for (const application of applicationListResult.getEntities()) {
        if (
          !(await repository.findOne(
            {
              id: application.id,
            },
            {},
            undefined,
          )) ||
          options.replaceExisting
        ) {
          const newApplication = importDepreciatedFields(application);
          await repository.save(newApplication, undefined);
        }
      }
    } while (page.page_token);
  }
}

const services = [
  "storage",
  "counter",
  "platform-services",
  "user",
  "search",
  "channels",
  "database",
  "webserver",
  "message-queue",
  "applications",
  "console",
  "auth",
  "statistics",
  "realtime",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "application",
  describe: "command that allow you to migrate php applications to node",
  builder: {
    onlyApplication: {
      default: null,
      type: "string",
      description: "Migrate only this application ID",
    },
    replaceExisting: {
      default: false,
      type: "boolean",
      description: "Replace already migrated applications",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php applications - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new ApplicationMigrator(platform);

    const onlyApplication = argv.onlyApplication as string | null;
    const replaceExisting = (argv.replaceExisting || false) as boolean;

    await migrator.run({
      onlyApplication,
      replaceExisting,
    });

    return spinner.stop();
  },
};

export default command;

export const importDepreciatedFields = (application: PhpApplication): Application => {
  const newApplication = new Application();

  newApplication.id = application.id;
  newApplication.company_id = application.group_id;
  newApplication.is_default = application.is_default;

  if (!newApplication.identity?.name) {
    newApplication.identity = {
      code:
        application.depreciated_simple_name ||
        (application.depreciated_name || "").toLocaleLowerCase(),
      name: application.depreciated_name,
      icon: application.depreciated_icon_url,
      description: application.depreciated_description,
      website: "http://twake.app/",
      categories: [],
      compatibility: ["twake"],
    };
  }

  if (newApplication.publication?.published === undefined) {
    newApplication.publication = newApplication.publication || {
      published: false,
      requested: false,
    };
    newApplication.publication.published = application.depreciated_is_available_to_public;
    newApplication.publication.requested =
      application.depreciated_public && !application.depreciated_twake_team_validation;
  }

  if (!newApplication.stats?.version) {
    newApplication.stats = newApplication.stats || {
      created_at: null,
      updated_at: null,
      version: null,
    };
    newApplication.stats.version = 1;
    newApplication.stats.created_at = Date.now();
    newApplication.stats.updated_at = Date.now();
  }

  if (!newApplication.api?.private_key) {
    newApplication.api = newApplication.api || {
      hooks_url: null,
      allowed_ips: null,
      private_key: null,
    };
    newApplication.api.hooks_url = application.depreciated_api_events_url;
    newApplication.api.allowed_ips = application.depreciated_api_allowed_ip;
    newApplication.api.private_key = application.depreciated_api_private_key;
  }

  if (newApplication.access?.write === undefined) {
    newApplication.access = newApplication.access || {
      read: null,
      write: null,
      delete: null,
      hooks: null,
    };
    try {
      newApplication.access.write = JSON.parse(application.depreciated_capabilities || "[]") || [];
      newApplication.access.delete = JSON.parse(application.depreciated_capabilities || "[]") || [];
    } catch (e) {
      newApplication.access.write = [];
      newApplication.access.delete = [];
    }
    try {
      newApplication.access.read = JSON.parse(application.depreciated_privileges || "[]") || [];
    } catch (e) {
      newApplication.access.read = [];
    }
    try {
      newApplication.access.hooks = JSON.parse(application.depreciated_hooks || "[]") || [];
    } catch (e) {
      newApplication.access.hooks = [];
    }
  }

  newApplication.display = importDepreciatedDisplayFields(
    newApplication,
    JSON.parse(application.depreciated_display_configuration),
  );

  return newApplication;
};

export const importDepreciatedDisplayFields = (
  application: Application,
  depreciatedDisplay: DepreciatedDisplayConfiguration,
): Application["display"] => {
  let display = application.display;

  if (!display?.twake) {
    display = display || { twake: {} };
    display.twake = display.twake || {};
  }

  display.twake.tab = depreciatedDisplay?.channel_tab
    ? { url: depreciatedDisplay?.channel_tab?.iframe } || true
    : undefined;

  display.twake.standalone = depreciatedDisplay?.app
    ? { url: depreciatedDisplay?.app?.iframe } || true
    : undefined;

  display.twake.configuration = [];
  if (depreciatedDisplay?.configuration?.can_configure_in_workspace)
    display.twake.configuration.push("global");
  if (depreciatedDisplay?.configuration?.can_configure_in_channel)
    display.twake.configuration.push("channel");

  display.twake.direct = depreciatedDisplay?.member_app
    ? { name: application.identity.name, icon: application.identity.icon } || true
    : undefined;

  if (depreciatedDisplay?.drive_module) {
    display.twake.files = {
      editor: undefined,
      actions: [],
    };

    display.twake.files.editor = {
      preview_url: depreciatedDisplay?.drive_module?.can_open_files?.preview_url,
      edition_url: depreciatedDisplay?.drive_module?.can_open_files?.url,
      extensions: [
        ...(depreciatedDisplay?.drive_module?.can_open_files?.main_ext || []),
        ...(depreciatedDisplay?.drive_module?.can_open_files?.other_ext || []),
      ],
      empty_files: (depreciatedDisplay?.drive_module?.can_create_files as any) || [],
    };
  }

  if (depreciatedDisplay?.messages_module) {
    display.twake.chat = {
      input:
        depreciatedDisplay?.messages_module?.in_plus ||
        depreciatedDisplay?.messages_module?.right_icon
          ? {
              icon: application.identity.icon,
            }
          : undefined,
      commands:
        (depreciatedDisplay?.messages_module
          ?.commands as Application["display"]["twake"]["chat"]["commands"]) || undefined,
      actions: depreciatedDisplay?.messages_module?.action
        ? [
            {
              name: depreciatedDisplay?.messages_module?.action.description,
              id: "default",
            },
          ]
        : undefined,
    };
  }

  return display;
};
