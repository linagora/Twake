import { CommandModule } from "yargs";

const command: CommandModule = {
  describe: "Manage Twake Users",
  command: "users <command>",
  builder: yargs =>
    yargs.commandDir("users_cmds", {
      visit: commandModule => commandModule.default,
    }),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handler: () => {},
};

export default command;
