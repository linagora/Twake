import yargs from "yargs";
import ora from "ora";
import Table from "cli-table";
import twake from "../../../twake";
import UserServiceAPI from "../../../services/user/api";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type ListParams = {
  size: string;
};

const services = [
  "platform-service",
  "user",
  "search",
  "channels",
  "notifications",
  "database",
  "webserver",
  "pubsub",
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
    const userService = platform.getProvider<UserServiceAPI>("user");
    const workspaces = await userService.workspaces.list({ limitStr: argv.size });

    spinner.stop();
    workspaces.getEntities().forEach(ws => table.push([ws.id, ws.name]));
    console.log(table.toString());
  },
};

export default command;
