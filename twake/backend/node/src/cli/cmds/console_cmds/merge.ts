import yargs from "yargs";
import ora from "ora";
import twake from "../../../twake";
import { ConsoleServiceAPI } from "../../../services/console/api";
import { CompanyReport, UserReport } from "../../../services/console/types";

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
    const userReports: UserReport[] = [];
    const companyReports: CompanyReport[] = [];

    const process = merge.subscribe({
      next: report => {
        if (report.type === "company:created") {
          companyReports.push(report.company);

          if (report.company.status === "success") {
            spinner.text = `Company created: ${report.company.company.source.id} (${report.company.company.source.displayName})`;
          } else {
            spinner.text = `Creation error for company ${report.company.company.source.id} (${report.company.company.source.displayName})`;
          }
        }

        if (report.type === "user:created") {
          userReports.push(report.user);
          if (report.user.status === "success") {
            spinner.text = `Company ${report.user.user.source.company.id}: User created ${report.user.user.destination.id}`;
          } else {
            spinner.text = "User creation error";
          }
        }
      },
      error: () => {
        spinner.fail("Fatal error");
      },
      complete: async () => {
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
      console.log(
        "Companies success:",
        companyReports.filter(company => company.status === "success").length,
      );
      console.log(
        "Companies failure:",
        companyReports.filter(company => company.status === "failure").length,
      );
      console.log("Users success:", userReports.filter(user => user.status === "success").length);
      console.log("Users failure:", userReports.filter(user => user.status === "failure").length);

      if (argv.csv) {
        reportAsCSV();
      }
    }
  },
};

export default command;
