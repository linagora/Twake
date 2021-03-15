import { CommandModule } from "yargs";

const command: CommandModule = {
  describe: "Generate Twake data",
  command: "generate <command>",
  builder: yargs =>
    yargs.commandDir("generate_cmds", {
      visit: commandModule => commandModule.default,
    }),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handler: () => {},
};

export default command;
