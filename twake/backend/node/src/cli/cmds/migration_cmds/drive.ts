import ora from "ora";
import globalResolver from "../../../services/global-resolver";
import twake from "../../../twake";
import yargs from "yargs";
import DriveMigrator from "./php-drive-file/drive-migrator-service";

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
  command: "drive",
  describe: "migrate php drive items to node",
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
  },
  handler: async argv => {
    const from = argv.from as string | null;
    const onlyCompany = argv.onlyCompany as string | null;

    const spinner = ora({ text: "Migrating php drive - " }).start();
    const platform = await twake.run(services);
    await globalResolver.doInit(platform);
    const migrator = new DriveMigrator(platform, {from, onlyCompany}});

    await migrator.run();

    return spinner.stop();
  },
};

export default command;
