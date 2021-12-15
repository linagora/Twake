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
  // "auth",
  // "realtime",
  // "websocket",
  // "user",
  "search",
  "database",
  "webserver",
  // "statistics",
];

const command: yargs.CommandModule<unknown, CLIArgs> = {
  command: "unpublish <id>",
  describe: "command that allow you to make application unavailable on the marketplace",
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

      if (!app.publication.published) {
        console.error("Application is not published");
        process.exit(1);
      }

      spinner = ora({ text: "Unpublishing application" }).start();
      await service.applications.unpublish({ id: argv.id });
      app = await service.applications.get({ id: argv.id });
      spinner.stop();
      console.log("Application unpublished");

      table = new Table();
      table.push(app);
      table.push({ published: app.publication.published });
      console.log(table.toString());
    }
    process.exit(0);
  },
};

export default command;
