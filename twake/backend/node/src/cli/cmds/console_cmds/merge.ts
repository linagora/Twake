import yargs from "yargs";
import ora from "ora";
import { count, groupBy, mergeMap, min, share } from "rxjs/operators";
import twake from "../../../twake";
import { ConsoleServiceAPI } from "../../../services/console/api";
import { UserCreatedStreamObject } from "../../../services/console/types";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type MergeParams = {
  url: string;
  concurrent: number;
  dry: boolean;
  console: string;
  link: boolean;
  client: string;
  secret: string;
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

const command: yargs.CommandModule<MergeParams, MergeParams> = {
  command: "merge",
  describe: "Merge Twake Chat users in the Twake Console",
  builder: {
    url: {
      default: "http://localhost:8080",
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
    console: {
      default: "console",
      type: "string",
      description: "The console service identifier to user to link user and companies",
    },
    link: {
      default: false,
      type: "boolean",
      description:
        "Link the companies/users to external companies/user. Works with the --console parameter",
      implies: "console",
    },
    client: {
      default: "twake",
      type: "string",
      description: "Client identifier to be used to authenticate calls to the Console",
    },
    secret: {
      default: "secret",
      type: "string",
      description: "Client secret to be used to authenticate calls to the Console",
    },
  },
  handler: async argv => {
    const spinner = ora({ text: "Importing Twake data" }).start();
    const platform = await twake.run(services);
    const consoleService = platform.getProvider<ConsoleServiceAPI>("console");
    const merge = consoleService.merge(
      argv.url,
      argv.concurrent,
      argv.dry,
      argv.console,
      argv.link,
      argv.client,
      argv.secret,
    );
    const stats = {
      users: 0,
      companies: 0,
      userErrors: 0,
      companyErrors: 0,
    };
    const companyOwners: UserCreatedStreamObject[] = [];

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
            // get the user with the smaller creation date, let's say that this is the first one in the company so it is the owner
            min((a, b) => {
              return (a.source?.user?.dateAdded || 0) <= (b.source?.user?.dateAdded || 0) ? -1 : 1;
            }),
          ),
        ),
      )
      .subscribe({
        complete: () => {
          oldestUserPerCompany.unsubscribe();
        },
        next: oldestUserInCompany => {
          companyOwners.push(oldestUserInCompany);
        },
      });

    const companiesSubscription = companies$.subscribe({
      next: company => {
        if (!company.error) {
          spinner.text = `Company created: ${company.source.id} (${company.source.displayName})`;
          stats.companies++;
        } else {
          stats.companyErrors++;
          spinner.text = `Creation error for company ${company.source.id} (${company.source.displayName})`;
        }
      },
      error: async () => {
        spinner.text = "Error while creating a company";
      },
      complete: () => (spinner.text = "All companies are created"),
    });

    const usersSubscription = users$.subscribe({
      next: user => {
        if (user.error) {
          spinner.text = "User creation error";
          stats.userErrors++;
        } else {
          spinner.text = `Company ${user.source.company.id}: User created ${user.destination.id}`;
        }
      },
      error: async () => {
        spinner.fail("Error while importing users");
      },
      complete: async () => {
        spinner.succeed("Merge is complete");
        await tearDown();
        companyOwners.map(user => {
          console.log(
            "Owner to create in company",
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
      console.log(stats);
    }
  },
};

export default command;
