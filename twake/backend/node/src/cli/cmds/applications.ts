import { CommandModule } from "yargs";

const command: CommandModule = {
  describe: "Manage Twake Applications",
  command: "applications <command>",
  builder: yargs =>
    yargs.commandDir("applications_cmds", {
      visit: commandModule => commandModule.default,
    }),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handler: () => {},
};

export default command;
