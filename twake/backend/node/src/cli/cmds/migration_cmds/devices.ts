import yargs from "yargs";
import twake from "../../../twake";
import ora from "ora";
import { TwakePlatform } from "../../../core/platform/platform";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PhpDevice, TYPE as phpTYPE } from "./php-device/php-device-entity";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import Device, { TYPE, getInstance } from "../../../services/user/entities/device";
import User, { TYPE as userTYPE } from "../../../services/user/entities/user";
import _ from "lodash";
import gr from "../../../services/global-resolver";

type Options = {
  replaceExisting?: boolean;
};

class DeviceMigrator {
  database: DatabaseServiceAPI;

  constructor(readonly platform: TwakePlatform) {
    this.database = this.platform.getProvider<DatabaseServiceAPI>("database");
  }

  public async run(options: Options = {}): Promise<void> {
    const phpRepository = await this.database.getRepository(phpTYPE, PhpDevice);
    const userRepository = await this.database.getRepository(userTYPE, User);
    const repository = await this.database.getRepository(TYPE, Device);

    // Get all companies
    let page: Pagination = { limitStr: "100" };
    // For each devices
    do {
      const deviceListResult = await phpRepository.find({}, { pagination: page }, undefined);
      page = deviceListResult.nextPage as Pagination;

      for (const device of deviceListResult.getEntities()) {
        if (
          !(await repository.findOne({ id: device.value }, {}, undefined)) ||
          options.replaceExisting
        ) {
          if (device.type === "FCM" || device.type === "fcm") {
            const newDevice = new Device();
            newDevice.id = device.value;
            newDevice.type = "FCM";
            newDevice.user_id = device.user_id;
            newDevice.version = device.version;
            await repository.save(newDevice, undefined);

            const user = await userRepository.findOne({ id: device.user_id }, {}, undefined);
            if (user) {
              user.devices = _.uniq([...(user.devices || []), newDevice.id]);
              await userRepository.save(user, undefined);
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
  command: "device",
  describe: "command that allow you to migrate php devices to node",
  builder: {
    replaceExisting: {
      default: false,
      type: "boolean",
      description: "Replace already migrated devices",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async argv => {
    const spinner = ora({ text: "Migrating php devices - " }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const migrator = new DeviceMigrator(platform);

    const replaceExisting = (argv.replaceExisting || false) as boolean;

    await migrator.run({
      replaceExisting,
    });

    return spinner.stop();
  },
};

export default command;
