import yargs from "yargs";
import twake from "../../../twake";
import { getLogger } from "../../../core/platform/framework/logger";
import { ConsoleServiceAPI } from "../../../services/console/api";
import { count, share } from "rxjs/operators";

type MergeParams = {
  url: string;
  concurrent: number;
  dry: boolean;
};

const services = [
  "user",
  "channels",
  "notifications",
  "database",
  "webserver",
  "pubsub",
  "console",
];
const logger = getLogger("cli");

const command: yargs.CommandModule<MergeParams, MergeParams> = {
  command: "merge",
  describe: "Merge Twake Chat users in the Twake Console",
  builder: {
    url: {
      default: "http://localhost:3000",
      type: "string",
      description: "URL of the Twake console",
    },
    concurrent: {
      default: 1,
      type: "number",
      description: "Number of concurrent imports",
    },
    dry: {
      default: false,
      type: "boolean",
      description: "Make a dry run without creating anything on the Twake console",
    },
  },
  handler: async argv => {
    const platform = await twake.run(services);
    const consoleService = platform.getProvider<ConsoleServiceAPI>("console");
    const merge = consoleService.merge(argv.url, argv.concurrent, argv.dry);
    const stats = {
      users: 0,
      companies: 0,
    };
    const companies = [];

    const users$ = merge.users$.pipe(share());
    const companies$ = merge.companies$.pipe(share());
    const countUsers = users$.pipe(count()).subscribe({
      next: count => (stats.users = count),
    });
    const countCompanies = companies$.pipe(count()).subscribe({
      next: count => (stats.companies = count),
    });

    const companiesSubscription = companies$.subscribe({
      next: company => {
        logger.info("New company created %s", company.source.displayName);
        companies.push(company);
      },
      error: async (err: Error) => {
        logger.error("Error while creating a company: %s", err.message);
      },
      complete: () => logger.info("All companies are created"),
    });

    const usersSubscription = users$.subscribe({
      next: user => logger.info("New user created - %s", user.destination.id),
      error: async (err: Error) => {
        logger.error("Error while creating user %s: ", err.message);
        await tearDown();
        logger.info("⛔️ Merge is not complete: some users may not have been imported %o", stats);
      },
      complete: async () => {
        await tearDown();
        logger.info("✅ Merge is complete: %o", stats);
        console.log("COMPA", companies.length);
      },
    });

    async function tearDown() {
      await platform.stop();
      usersSubscription.unsubscribe();
      companiesSubscription.unsubscribe();
      countUsers.unsubscribe();
      countCompanies.unsubscribe();
    }
  },
};

export default command;
