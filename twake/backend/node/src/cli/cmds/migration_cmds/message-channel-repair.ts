import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { TwakePlatform } from "../../../core/platform/platform";
import gr from "../../../services/global-resolver";

type Options = {
  from?: string;
  onlyCompany?: string;
  onlyWorkspace?: string;
  onlyChannel?: string;
  dryRun?: boolean;
};

class MessageReferenceRepair {
  database: DatabaseServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options: Options = {}): Promise<void> {
    //TODO repair messages
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
  "messages",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "message-channel-repair",
  describe: "command that allow you to repair messages references in channels",
  builder: {
    from: {
      default: null,
      type: "string",
      description: "Start migration from this company ID",
    },
    onlyCompany: {
      default: null,
      type: "string",
      description: "Migrate only this company ID",
    },
    onlyWorkspace: {
      default: null,
      type: "string",
      description: "Migrate only this workspace ID",
    },
    onlyChannel: {
      default: null,
      type: "string",
      description: "Migrate only this channel ID",
    },
    dryRun: {
      default: false,
      type: "boolean",
      description: "Do not save anything and show missing references",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Fixing messages references - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new MessageReferenceRepair(platform);

    const from = argv.from as string | null;
    const onlyCompany = argv.onlyCompany as string | null;
    const onlyWorkspace = argv.onlyWorkspace as string | null;
    const onlyChannel = argv.onlyChannel as string | null;
    const dryRun = (argv.dryRun || false) as boolean;

    await migrator.run({
      from,
      onlyCompany,
      onlyWorkspace,
      onlyChannel,
      dryRun,
    });

    return spinner.stop();
  },
};

export default command;
