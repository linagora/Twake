import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";
import Table from "cli-table";
import { ApplicationServiceAPI } from "../../../services/applications/api";
import * as process from "process";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type CLIArgs = {
  id: string;
};

const services = [
  "storage",
  "counter",
  "pubsub",
  "platform-services",
  "applications",
  "auth",
  "realtime",
  "websocket",
  "user",
  "search",
  "database",
  "webserver",
  "statistics",
];

const command: yargs.CommandModule<unknown, CLIArgs> = {
  command: "publish <id>",
  describe:
    "command that allow you to validate an application and make it available on the marketplace",
  builder: {
    force: {
      default: false,
      type: "boolean",
      description: "Force update unrequested application",
    },
  },
  handler: async argv => {
    if (argv.id) {
      let spinner = ora({ text: "Retrieving application" }).start();
      const platform = await twake.run(services);
      const service = platform.getProvider<ApplicationServiceAPI>("applications");
      let app = await service.applications.get({ id: argv.id });
      spinner.stop();
      if (!app) {
        console.error(`Application ${argv.id} not found`);
        process.exit(1);
      }
      let table = new Table();
      table.push(app);
      table.push({ name: app.identity.name });
      table.push({ description: app.identity.description });
      table.push({ website: app.identity.website });
      table.push({ requested: app.publication.requested });
      table.push({ published: app.publication.published });
      console.log(table.toString());

      if (app.publication.published) {
        console.error("Application already published");
        process.exit(1);
      }

      if (!app.publication.requested && !argv.force) {
        console.error(
          "Application is not requested to be published. Use --force if you want to publish it anyway",
        );
        process.exit(1);
      }

      spinner = ora({ text: "Publishing application" }).start();
      await service.applications.publish({ id: argv.id });
      app = await service.applications.get({ id: argv.id });

      spinner.stop();
      console.log("Application published");

      table = new Table();
      table.push(app);
      table.push({ published: app.publication.published });
      console.log(table.toString());
    }
    process.exit(0);
  },
};

export default command;
