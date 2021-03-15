import { CommandModule } from "yargs";

const command: CommandModule = {
  describe: "Manage Twake Console",
  command: "console <command>",
  builder: yargs =>
    yargs.commandDir("console_cmds", {
      visit: commandModule => commandModule.default,
    }),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handler: () => {},
};

export default command;
