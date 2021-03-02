import passwordGenerator from "generate-password";
import { from, pipe } from "rxjs";
import { bufferCount, first, map, mergeMap, switchMap, tap } from "rxjs/operators";
import { v1 as uuid } from "uuid";
import yargs from "yargs";

import Company, {
  getInstance as getCompanyInstance,
} from "../../../services/user/entities/company";
import CompanyUser from "../../../services/user/entities/company_user";
import UserServiceAPI from "../../../services/user/api";
import twake from "../../../twake";
import { getInstance as getUserInstance } from "../../../services/user/entities/user";
import { getLogger } from "../../../core/platform/framework/logger";

type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
};

type CLIArgs = {
  company: number;
  user: number;
  concurrent: number;
};

const logger = getLogger("cli");
const services = ["user", "channels", "notifications", "database", "webserver", "pubsub"];

// eslint-disable-next-line @typescript-eslint/ban-types
const command: yargs.CommandModule<{}, CLIArgs> = {
  command: "users",
  describe: "Generate users and companies",
  builder: {
    company: {
      alias: "c",
      default: 3,
      type: "number",
      description: "Number of companies to generate",
    },
    user: {
      alias: "u",
      default: 5,
      type: "number",
      description: "Number of users to generate in the company",
    },
    concurrent: {
      default: 1,
      type: "number",
      description: "Number of concurrent creation tasks",
    },
  },
  handler: async argv => {
    const concurrentTasks = argv.concurrent;
    const nbUsersPerCompany = argv.user;
    const nbCompanies = argv.company;
    const platform = await twake.run(services);
    const userService = platform.getProvider<UserServiceAPI>("user");
    const companies = getCompanies(nbCompanies);
    const createUser = async (userInCompany: {
      user: User;
      company: Company;
    }): Promise<CompanyUser> => {
      logger.info("Creating user %o", userInCompany);
      const created = await userService.users.create(getUserInstance(userInCompany.user));

      return userService.companies.addUserInCompany(userInCompany.company, created.entity);
    };
    const createCompany = (company: Company) => {
      logger.info("Creating company %o", company);
      return userService.companies.createCompany(company);
    };

    const obsv$ = from(companies).pipe(
      // Create companies sequentially
      mergeMap(company => createCompany(company), concurrentTasks),
      bufferCount(companies.length),
      tap(companies => logger.info("Created companies %s", companies.length)),
      // for each created company
      switchMap(companies => from(companies)),
      map(company => getUsersForCompany(company, nbUsersPerCompany)),
      // Create users sequentially
      pipe(
        switchMap(userCompanies => from(userCompanies)),
        mergeMap(userCompany => createUser(userCompany), concurrentTasks),
        // until we reach the number of users in the company
        bufferCount(nbUsersPerCompany),
      ),
      // until we reach the number of companies
      bufferCount(companies.length),
      first(),
    );

    return obsv$
      .toPromise()
      .then(() => platform.stop())
      .finally(() => logger.info("✅ Company users are now created"));
  },
};

const getCompanies = (size: number = 10): Company[] => {
  return [...Array(size).keys()].map(i =>
    getCompanyInstance({
      id: uuid(),
      name: `twake${i}.app`,
      displayName: `My Twake Company #${i}`,
    }),
  );
};

const getUsersForCompany = (company: Company, size: number = 10) => {
  return getUsers(company, size).map(user => ({
    user,
    company,
  }));
};

const getUsers = (company: Company, size: number = 100): User[] => {
  return [...Array(size).keys()].map(i => getUser(company, i));
};

const getUser = (company: Company, id: number): User => {
  return {
    id: uuid(),
    firstname: "John",
    lastname: `Doe${id}`,
    email: `user${id}@${company.name}`,
    password: passwordGenerator.generate({
      length: 10,
      numbers: true,
    }),
  };
};

export default command;
