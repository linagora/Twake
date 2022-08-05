import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";
import Table from "cli-table";
import * as process from "process";
import gr from "../../../services/global-resolver";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type CLIArgs = Record<string, unknown>;

const services = [
  "storage",
  "counter",
  "message-queue",
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
    await gr.doInit(platform);
    //
    const unpublished = await gr.services.applications.marketplaceApps.listUnpublished(undefined);
    //
    const table = new Table({
      head: ["ID", "Name", "Description"],
      colWidths: [40, 20, 40],
    });
    unpublished.forEach((app: any) => {
      table.push([app.id, app.identity.name, app.identity.description]);
    });
    spinner.stop();
    console.log(table.toString());
    await platform.stop();
    process.exit(0);
  },
};

export default command;
