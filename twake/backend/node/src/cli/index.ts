import yargs from "yargs";

process.env.NODE_ENV = "CLI";

yargs
  .strict()
  .usage("Usage: $0 <command> [options]")
  .commandDir("cmds", {
    visit: commandModule => commandModule.default,
  })
  .demandCommand(1, "Please supply a valid command")
  .alias("help", "h")
  .help("help")
  .version()
  .epilogue("for more information, go to https://twake.app")
  .example("$0 <command> --help", "show help of the issue command").argv;
