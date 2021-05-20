import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import MessageMigrator from "./php-message/message-migrator-service";

const services = ["user", "channels", "database", "webserver", "pubsub", "messages"];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "message",
  describe: "command that allow you to migrate php messages to node",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php messages - " }).start();
    const platform = await twake.run(services);
    const migrator = new MessageMigrator(platform);

    await migrator.run();

    return spinner.stop();
  },
};

export default command;
