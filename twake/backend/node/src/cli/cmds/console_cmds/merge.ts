import yargs from "yargs";
import { count, groupBy, mergeMap, min, share } from "rxjs/operators";
import twake from "../../../twake";
import { getLogger } from "../../../core/platform/framework/logger";
import { ConsoleServiceAPI } from "../../../services/console/api";
import { UserCreatedStreamObject } from "../../../services/console/types";

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
    const adminsToCreate: UserCreatedStreamObject[] = [];

    const users$ = merge.users$.pipe(share());
    const companies$ = merge.companies$.pipe(share());
    const countUsers = users$.pipe(count()).subscribe({
      next: count => (stats.users = count),
    });
    const oldestUserPerCompany = users$
      .pipe(
        // group by company id
        groupBy(userInCompany => userInCompany.source.company.id),
        mergeMap(group =>
          group.pipe(
            // get the user with the smaller creation date, let's say that this is the first one in the company so it is the admin
            min((a, b) => {
              return (a.source?.user?.creationdate || 0) <= (b.source?.user?.creationdate || 0)
                ? -1
                : 1;
            }),
          ),
        ),
      )
      .subscribe({
        complete: () => {
          oldestUserPerCompany.unsubscribe();
        },
        next: oldestUserInCompany => {
          adminsToCreate.push(oldestUserInCompany);
        },
      });

    const companiesSubscription = companies$.subscribe({
      next: company => {
        logger.info("New company created %s", company.source.displayName);
        stats.companies++;
      },
      error: async (err: Error) => {
        logger.error("Error while creating a company: %s", err.message);
      },
      complete: () => logger.info("All companies are created"),
    });

    const usersSubscription = users$.subscribe({
      next: user =>
        logger.info(
          "New user created - %s (%s)",
          user.destination.id,
          user.source.user.creationdate,
        ),
      error: async (err: Error) => {
        logger.error("Error while creating user %s: ", err.message);
        await tearDown();
        logger.info("⛔️ Merge is not complete: some users may not have been imported %o", stats);
      },
      complete: async () => {
        await tearDown();
        logger.info("✅ Merge is complete: %o", stats);
        adminsToCreate.map(user => {
          console.log(
            "Admin to create in company",
            user.source.company.id,
            ":",
            user.source.user.id,
          );
        });
      },
    });

    async function tearDown() {
      await platform.stop();
      usersSubscription.unsubscribe();
      companiesSubscription.unsubscribe();
      countUsers.unsubscribe();
    }
  },
};

export default command;
