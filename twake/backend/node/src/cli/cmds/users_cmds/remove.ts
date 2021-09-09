import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";
import UserServiceAPI from "../../../services/user/api";
import { getInstance as getUserInstance } from "../../../services/user/entities/user";
import Table from "cli-table";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type CLIArgs = {
  id: string;
};

const services = ["platform-services", "user", "search", "database", "webserver"];

const command: yargs.CommandModule<unknown, CLIArgs> = {
  command: "remove",
  describe: "command that allow you to remove one user",
  builder: {
    id: {
      default: "",
      type: "string",
      description: "User ID",
    },
  },
  handler: async argv => {
    const tableBefore = new Table({
      head: ["User ID", "Username", "Deleted"],
      colWidths: [40, 40, 10],
    });
    const tableAfter = new Table({
      head: ["User ID", "Username", "Deleted"],
      colWidths: [40, 40, 10],
    });
    const spinner = ora({ text: "Retrieving user" }).start();

    const platform = await twake.run(services);
    const userService = platform.getProvider<UserServiceAPI>("user");

    const user = await userService.users.get({ id: argv.id });

    if (!user) {
      console.error("Error: You need to provide User ID");
      return spinner.stop();
    }

    if (user) {
      // Table before
      tableBefore.push([user.id, user.username_canonical, user.deleted]);

      await userService.users.anonymizeAndDelete(
        { id: user.id },
        {
          user: { id: user.id, server_request: true },
        },
      );

      const finalUser = await userService.users.get(getUserInstance({ id: argv.id }));

      // Table after
      tableAfter.push([finalUser.id, finalUser.username_canonical, finalUser.deleted]);

      spinner.stop();
    }
  },
};

export default command;
