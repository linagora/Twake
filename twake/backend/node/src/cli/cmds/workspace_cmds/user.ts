import yargs from "yargs";
import ora from "ora";
import Table from "cli-table";
import twake from "../../../twake";
import UserServiceAPI from "../../../services/user/api";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type ListParams = {
  id: string;
};

const services = ["user", "channels", "notifications", "database", "webserver", "pubsub"];

const command: yargs.CommandModule<ListParams, ListParams> = {
  command: "user",
  describe: "List workspace ers",
  builder: {
    id: {
      default: "f339d54a-e833-11ea-92c3-0242ac120004",
      type: "string",
      description: "Workspace ID",
    },
  },
  handler: async argv => {
    const table = new Table({ head: ["user ID", "Date Added"], colWidths: [40, 40] });
    const spinner = ora({ text: "Retrieving workspace users" }).start();
    const platform = await twake.run(services);
    const userService = platform.getProvider<UserServiceAPI>("user");
    const users = await userService.workspaces.getUsers({ workspaceId: argv.id });

    spinner.stop();
    users
      .getEntities()
      .forEach(u => table.push([u.id, new Date(u.dateAdded).toLocaleDateString()]));
    console.log(table.toString());
  },
};

export default command;
