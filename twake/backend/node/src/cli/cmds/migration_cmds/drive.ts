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
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "drive",
  describe: "migrate php drive items to node",
  builder: {},
  handler: async _argv => {
    const spinner = ora({ text: "Migrating php drive items -" }).start();
    const platform = await twake.run(services);
    await globalResolver.doInit(platform);
    const migrator = new DriveMigrator(platform);

    await migrator.run();

    return spinner.stop();
  },
};

export default command;
