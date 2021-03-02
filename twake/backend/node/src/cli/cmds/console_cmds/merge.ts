import axios, { AxiosInstance } from "axios";
import { BehaviorSubject, concat, EMPTY, from, Observable } from "rxjs";
import { distinct, map, mergeMap, tap } from "rxjs/operators";
import yargs from "yargs";
import Company from "../../../services/user/entities/company";
import User from "../../../services/user/entities/user";
import UserServiceAPI from "../../../services/user/api";
import twake from "../../../twake";
import { Paginable } from "../../../core/platform/framework/api/crud-service";
import { getLogger } from "../../../core/platform/framework/logger";

const services = ["user", "channels", "notifications", "database", "webserver", "pubsub"];
const logger = getLogger("cli");

type MergeParams = {
  url: string;
};

type ConsoleCompany = {
  code: string;
};

type ConsoleUser = {
  id: string;
};

const command: yargs.CommandModule<MergeParams, MergeParams> = {
  command: "merge",
  describe: "Merge Twake Chat users in the Twake Console",
  builder: {
    url: {
      default: "http://localhost:3000",
      type: "string",
      description: "URL of the Twake console",
    },
  },
  handler: async argv => {
    const companyCreated = new BehaviorSubject(0);
    const usersCreated = new BehaviorSubject(0);
    const platform = await twake.run(services);
    const consoleClient = new ConsoleClient(argv.url);
    const userService = platform.getProvider<UserServiceAPI>("user");

    const createCompany = (
      company: Company,
    ): Promise<{ source: Company; destination: ConsoleCompany }> => {
      const result: ConsoleCompany = {
        code: company.id,
      };
      return new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              source: company,
              destination: result,
            }),
          10,
        ),
      );
    };

    const createUser = (
      company: Company,
      user: User,
    ): Promise<{ source: { user: User; company: Company }; destination: ConsoleUser }> => {
      const result: ConsoleUser = {
        id: user.id,
      };
      return new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              source: { user, company },
              destination: result,
            }),
          1,
        ),
      );
    };

    const getUsers = (company: Company, paginable?: Paginable): Observable<User> => {
      return from(
        userService.companies.getUsersForCompany({ group_id: company.id }, paginable),
      ).pipe(
        mergeMap(usersResult => {
          const items$ = from(usersResult.getEntities());
          const next$ = usersResult?.nextPage?.page_token
            ? getUsers(company, usersResult.nextPage)
            : EMPTY;
          return concat(items$, next$);
        }),
        distinct(user => user.id),
      );
    };

    const getCompanies = (paginable?: Paginable): Observable<Company> => {
      return from(userService.companies.getCompanies(paginable)).pipe(
        mergeMap(companiesResult => {
          const items$ = from(companiesResult.getEntities());
          const next$ = companiesResult?.nextPage?.page_token
            ? getCompanies(companiesResult.nextPage)
            : EMPTY;

          return concat(items$, next$);
        }),
        distinct((company: Company) => company.id),
      );
    };

    const subscription = getCompanies()
      .pipe(
        tap(company => logger.info("Creating company in the Console", company.displayName)),
        mergeMap(company => createCompany(company), 1),
        tap(company => logger.info("Company created in the Console", company.destination.code)),
        tap(() => {
          // This is RXJS anti pattern, bit let's say that we can have others subscribing to this subject...
          companyCreated.next(companyCreated.getValue() + 1);
        }),
        mergeMap(company =>
          getUsers(company.source).pipe(
            map(user => ({
              user,
              company,
            })),
          ),
        ),
        mergeMap(userInCompany => createUser(userInCompany.company.source, userInCompany.user), 1),
      )
      .subscribe({
        next: userInCompany => {
          logger.info(
            `Company ${userInCompany.source.company.id} - User ${userInCompany.source.user.id} has been imported`,
          );
          usersCreated.next(usersCreated.getValue() + 1);
        },
        error: err => console.log(err),
        complete: () => {
          subscription.unsubscribe();
          usersCreated.complete();
        },
      });

    return usersCreated
      .toPromise()
      .then(() => platform.stop())
      .finally(() => {
        logger.info(
          `✅ Merge is complete: ${usersCreated.getValue()} users in ${companyCreated.getValue()} companies`,
        );
      });
  },
};

class ConsoleClient {
  private client: AxiosInstance;

  constructor(private baseURL: string = "http://localhost:3000") {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async createCompany(company: ConsoleCompany): Promise<ConsoleCompany> {
    //return axios.post(`/companies/${company.code}`, company, {
    //  headers: {
    //    "Content-Type": "application/json",
    //  }
    //}).then(({data}) => data);

    return new Promise(resolve => setTimeout(() => resolve(company), 500));
  }

  async createUser(user: ConsoleUser): Promise<ConsoleUser> {
    return new Promise(resolve => setTimeout(() => resolve(user), 100));
  }
}

export default command;
