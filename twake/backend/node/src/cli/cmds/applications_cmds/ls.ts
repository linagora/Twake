import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";
import Table from "cli-table";
import { ApplicationServiceAPI } from "../../../services/applications/api";
import * as process from "process";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type CLIArgs = {};

const services = [
  "storage",
  "counter",
  "pubsub",
  "platform-services",
  "applications",
  "auth",
  "realtime",
  "websocket",
  // "user",
  "search",
  "database",
  "webserver",
  // "statistics",
];

const command: yargs.CommandModule<unknown, CLIArgs> = {
  command: "ls",
  describe: "command that allow you to list applications (unpublished only)",

  handler: async argv => {
    const spinner = ora({ text: "Retrieving applications" }).start();
    const platform = await twake.run(services);
    const applicationService = platform.getProvider<ApplicationServiceAPI>("applications");
    //
    const unpublished = await applicationService.applications.listUnpublished();
    //
    const table = new Table({
      head: ["ID", "Name", "Description"],
      colWidths: [40, 20, 40],
    });
    unpublished.forEach(app => {
      table.push([app.id, app.identity.name, app.identity.description]);
    });
    spinner.stop();
    console.log(table.toString());
    await platform.stop();
    process.exit(0);
  },
};

const showUnpublishedApplications = async () => {};

export default command;
