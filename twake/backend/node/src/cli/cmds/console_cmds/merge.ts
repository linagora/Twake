import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";
import { CompanyReport, UserReport } from "../../../services/console/types";
import Company from "../../../services/user/entities/company";
import gr from "../../../services/global-resolver";
import { ConsoleServiceImpl } from "../../../services/console/service";

/**
 * Merge command parameters. Check the builder definition below for more details.
 */
type MergeParams = {
  url: string;
  concurrent: number;
  dry: boolean;
  console: string;
  link: boolean;
  csv: boolean;
  client: string;
  secret: string;
};

const services = [
  "platform-services",
  "user",
  "channels",
  "notifications",
  "database",
  "webserver",
  "message-queue",
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
    csv: {
      default: false,
      type: "boolean",
      description: "Generate result as CSV",
    },
    console: {
      default: "console",
      type: "string",
      description: "The console service identifier to user to link user and companies",
    },
    link: {
      default: true,
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
    const spinner = ora({ text: `Importing Twake data on ${argv.url}` }).start();
    const platform = await twake.run(services);
    await gr.doInit(platform);
    const consoleService = platform.getProvider<ConsoleServiceImpl>("console");
    const merge = consoleService.merge(
      argv.url,
      argv.concurrent,
      argv.dry,
      argv.console,
      argv.link,
      argv.client,
      argv.secret,
    );
    const start = Date.now();
    let stop: number = start;
    const userReports: UserReport[] = [];
    const companyReports: CompanyReport[] = [];
    const ownerReports: UserReport[] = [];
    let companiesWithoutAdmin: Company[] = [];

    const process = merge.subscribe({
      next: report => {
        if (report.type === "company:created") {
          const companyReport = report.data as CompanyReport;
          companyReports.push(companyReport);

          if (companyReport.status === "success") {
            spinner.succeed(
              `Company created: ${companyReport.company.source.id} ${companyReport.company.source.displayName}`,
            );
          } else {
            spinner.fail(
              `Creation error for company ${companyReport.company.source.id} (${companyReport.company.source.displayName}): ${companyReport?.error?.message}`,
            );
          }
        }

        if (report.type === "user:created") {
          const userReport = report.data as UserReport;
          userReports.push(userReport);

          if (userReport.status === "success") {
            spinner.succeed(
              `Company ${userReport.user.source.company.id}: User created ${userReport.user.destination.id}`,
            );
          } else {
            spinner.fail(
              `Company ${userReport.user.source.company.id}: User creation error ${userReport.user.destination.id}: ${userReport?.error?.message}`,
            );
          }
        }

        if (report.type === "user:updated") {
          const userReport = report.data as UserReport;
          ownerReports.push(userReport);
          if (userReport.status === "success") {
            spinner.succeed(
              `Company ${userReport.destinationCompanyCode} owner updated to user ${userReport.destinationId}`,
            );
          } else {
            spinner.fail(
              `Company ${userReport.destinationCompanyCode}: Owner update error for user ${userReport.destinationId}: ${userReport?.error?.message}`,
            );
          }
        }

        if (report.type === "processing:owner") {
          spinner.start("Computing company owners, please wait...");
        }

        if (report.type === "user:updating") {
          //spinner.succeed(`Updating owner for company ${report?.company?.sourceId}`);
        }

        if (report.type === "log") {
          report.message && (spinner.text = report.message);
        }

        if (report.type === "company:withoutadmin") {
          report.message && (spinner.text = report.message);
          const companies = (report.data || []) as Company[];

          if (companies.length) {
            companiesWithoutAdmin = companies;
          }
        }
      },
      error: () => {
        spinner.fail("Fatal error");
      },
      complete: async () => {
        stop = Date.now();
        spinner.succeed("Merge is complete");
        displayStats();
        await tearDown();
      },
    });

    async function tearDown() {
      await platform.stop();
      process.unsubscribe();
    }

    function reportAsCSV() {
      const users = userReports.map(
        user =>
          `${user.sourceId},${user.destinationId},${user.destinationCompanyCode},${user.status}`,
      );
      const userCSV = [...["sourceId,destinationId,destinationCompanyCode,status"], ...users].join(
        "\n",
      );

      const companies = companyReports.map(
        company => `${company.sourceId},${company.destinationCode},${company.status}`,
      );
      const companyCSV = [...["sourceId,destinationCode,status"], ...companies].join("\n");

      console.log(userCSV);
      console.log(companyCSV);
    }

    function displayStats() {
      const userFailures = userReports.filter(user => user.error);
      const companyFailures = companyReports.filter(company => company.error);
      const ownerFailures = ownerReports.filter(report => report.error);

      console.log("# Import report");
      console.log(`Data imported in ${(stop - start) / 1000} seconds`);
      console.log("## Company");
      console.log("- Companies success:", companyReports.filter(company => !company.error).length);
      console.log("- Companies failure:", companyFailures.length);
      if (companyFailures.length) {
        console.log("### Failures");
        companyFailures.forEach(failure =>
          console.log(
            `- Company ${failure.company.source.id} error: ${failure.company.error?.message}`,
          ),
        );
      }

      console.log("## User");
      console.log("- Users success:", userReports.filter(user => !user.error).length);
      console.log("- Users failure:", userFailures.length);
      if (userFailures.length) {
        console.log("### Failures");
        userFailures.forEach(failure =>
          console.log(
            `- User ${failure.user.source.user.user_id} error: ${failure.user.error?.message}`,
          ),
        );
      }

      console.log("## Owner");
      console.log("- Owners success:", ownerReports.filter(report => !report.error).length);
      console.log("- Owners failure:", ownerFailures.length);
      if (ownerFailures.length) {
        console.log("### Failures");
        ownerFailures.forEach(report =>
          console.log(`- User ${report.destinationId} error: ${report?.error?.message}`),
        );
      }

      console.log("## Warnings");
      console.log("### Companies witout admins");
      companiesWithoutAdmin.forEach(company => {
        console.log(`- ${company.id} - ${company.displayName}`);
      });

      if (argv.csv) {
        reportAsCSV();
      }
    }
  },
};

export default command;
