import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import MessageMigrator from "./php-message/message-migrator-service";

const services = ["user", "channels", "database", "webserver", "pubsub", "messages"];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "message",
  describe: "command that allow you to migrate php messages to node",
  builder: {
    from: {
      default: null,
      type: "string",
      description: "Start migration from this company ID",
    },
    only: {
      default: null,
      type: "string",
      description: "Migrate only this company ID",
    },
    ignoreExisting: {
      default: false,
      type: "boolean",
      description: "Skip existing message ids",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php messages - " }).start();
    const platform = await twake.run(services);
    const migrator = new MessageMigrator(platform);

    const from = argv.from as string | null;
    const only = argv.only as string | null;
    const ignoreExisting = (argv.ignoreExisting || false) as boolean;

    await migrator.run({ from, only, ignoreExisting });

    return spinner.stop();
  },
};

export default command;
