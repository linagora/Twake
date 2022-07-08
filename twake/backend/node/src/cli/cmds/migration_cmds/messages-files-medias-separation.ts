import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { TwakePlatform } from "../../../core/platform/platform";
import gr from "../../../services/global-resolver";

type Options = {};

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
  "pubsub",
  "messages",
];

const command: yargs.CommandModule<unknown, unknown> = {
  command: "messages-files-medias-separation",
  describe: "command to separate medias and files in messages-files channels refs",
  builder: {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Fixing messages references - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new MessageReferenceRepair(platform);

    await migrator.run({});

    return spinner.stop();
  },
};

export default command;
