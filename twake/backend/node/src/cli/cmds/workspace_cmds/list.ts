import yargs from "yargs";
import ora from "ora";
import Table from "cli-table";
import twake from "../../../twake";
import gr from "../../../services/global-resolver";
/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type ListParams = {
  size: string;
};

const services = [
  "platform-services",
  "user",
  "search",
  "channels",
  "notifications",
  "database",
  "webserver",
  "message-queue",
];

const command: yargs.CommandModule<ListParams, ListParams> = {
  command: "list",
  describe: "List Twake workspaces",
  builder: {
    size: {
      default: "50",
      type: "string",
      description: "Number of workspaces to fetch",
    },
  },
  handler: async argv => {
    const table = new Table({ head: ["ID", "Name"], colWidths: [40, 50] });
    const spinner = ora({ text: "List Twake workspaces" }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const workspaces = await gr.services.workspaces.list({ limitStr: argv.size });

    spinner.stop();
    workspaces.getEntities().forEach(ws => table.push([ws.id, ws.name]));
    console.log(table.toString());
  },
};

export default command;
