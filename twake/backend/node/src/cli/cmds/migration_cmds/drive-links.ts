import ora from "ora";
import globalResolver from "../../../services/global-resolver";
import twake from "../../../twake";
import yargs from "yargs";
import DriveLinksMigrator from "./php-drive-file/drive-links-migrator-service";

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
  "email-pusher",
  "files",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "drive-links",
  describe: "migrate php drive links items to node",
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
    fromItem: {
      default: null,
      type: "string",
      description: "Start migration from this item ID",
    },
    fromWorkspace: {
      default: null,
      type: "string",
      description: "Start migration from this workspace ID",
    },
  },
  handler: async argv => {
    const fromCompany = argv.from as string | null;
    const onlyCompany = argv.onlyCompany as string | null;
    const fromItem = argv.fromItem as string | null;
    const fromWorkspace = argv.fromWorkspace as string | null;

    const spinner = ora({ text: "Migrating php drive - " }).start();
    const platform = await twake.run(services);
    await globalResolver.doInit(platform);
    const migrator = new DriveLinksMigrator(platform, {
      fromCompany,
      onlyCompany,
      fromItem,
      fromWorkspace,
    });

    await migrator.run();

    return spinner.stop();
  },
};

export default command;
