import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import MessageMigrator from "./php-message/message-migrator-service";
import gr from "../../../services/global-resolver";

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
  "statistics",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "message",
  describe: "command that allow you to migrate php messages to node",
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
    ignoreExisting: {
      default: false,
      type: "boolean",
      description: "Skip existing message ids",
    },
    backToPhp: {
      default: false,
      type: "boolean",
      description:
        "Run the migration back, put node messages into php table (only the one that are not already here)",
    },
    dryRun: {
      default: false,
      type: "boolean",
      description: "Do not save anything",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php messages - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new MessageMigrator(platform);

    const from = argv.from as string | null;
    const onlyCompany = argv.onlyCompany as string | null;
    const onlyWorkspace = argv.onlyWorkspace as string | null;
    const onlyChannel = argv.onlyChannel as string | null;
    const ignoreExisting = (argv.ignoreExisting || false) as boolean;
    const backToPhp = (argv.backToPhp || false) as boolean;
    const dryRun = (argv.dryRun || false) as boolean;

    await migrator.run({
      from,
      onlyCompany,
      onlyWorkspace,
      onlyChannel,
      ignoreExisting,
      backToPhp,
      dryRun,
    });

    return spinner.stop();
  },
};

export default command;
