import passwordGenerator from "generate-password";
import { concat, EMPTY, from, Observable, ReplaySubject } from "rxjs";
import { distinct, map, mergeMap } from "rxjs/operators";
import { getLogger } from "../../../core/platform/framework";
import { Paginable } from "../../../core/platform/framework/api/crud-service";
import Company from "../../user/entities/company";
import User from "../../user/entities/user";
import UserServiceAPI from "../../user/api";
import {
  CompanyCreatedStreamObject,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  UserCreatedStreamObject,
} from "../types";
import { getInstance as getExternalUserInstance } from "../../user/entities/external_user";
import { getInstance as getExternalGroupInstance } from "../../user/entities/external_company";
import { ConsoleHTTPClient } from "../client";
import { ConsoleServiceClient } from "../api";

const logger = getLogger("console.process.merge");

export class MergeProcess {
  private client: ConsoleServiceClient;

  constructor(
    private userService: UserServiceAPI,
    consoleUrl: string,
    private dryRun: boolean,
    private consoleId: string = "console",
    private linkExternal: boolean = false,
  ) {
    this.client = new ConsoleHTTPClient(consoleUrl, dryRun);
  }

  getStreams(
    concurrent: number = 1,
  ): {
    companies$: Observable<CompanyCreatedStreamObject>;
    users$: Observable<UserCreatedStreamObject>;
  } {
    const companies$ = new ReplaySubject<CompanyCreatedStreamObject>();
    const users$ = this.getCompanies().pipe(
      mergeMap(company => this.createCompany(company), concurrent),
      map(company => {
        companies$.next(company);
        return company;
      }),
      mergeMap(company =>
        this.getUsers(company.source).pipe(
          map(user => ({
            user,
            company,
          })),
        ),
      ),
      mergeMap(
        userInCompany => this.createUser(userInCompany.company.source, userInCompany.user),
        concurrent,
      ),
    );

    return {
      companies$,
      users$,
    };
  }

  private getUsers(company: Company, paginable?: Paginable): Observable<User> {
    return from(
      this.userService.companies.getUsersForCompany({ group_id: company.id }, paginable),
    ).pipe(
      mergeMap(usersResult => {
        const items$ = from(usersResult.getEntities());
        const next$ = usersResult?.nextPage?.page_token
          ? this.getUsers(company, usersResult.nextPage)
          : EMPTY;
        return concat(items$, next$);
      }),
      distinct(user => user.id),
    );
  }

  private getCompanies(paginable?: Paginable): Observable<Company> {
    return from(this.userService.companies.getCompanies(paginable)).pipe(
      mergeMap(companiesResult => {
        const items$ = from(companiesResult.getEntities());
        const next$ = companiesResult?.nextPage?.page_token
          ? this.getCompanies(companiesResult.nextPage)
          : EMPTY;

        return concat(items$, next$);
      }),
      distinct((company: Company) => company.id),
    );
  }

  private async createCompany(company: Company): Promise<CompanyCreatedStreamObject> {
    logger.debug("Creating company in the Console %s", company.displayName);
    const result = await this.client.createCompany({
      code: company.id,
      displayName: company.displayName,
      // TODO
      status: "todo",
    });

    if (this.linkExternal) {
      await this.createCompanyLink(company, result, this.consoleId);
    }

    return {
      source: company,
      destination: {
        code: result.code,
      },
    };
  }

  private async createUser(company: Company, user: User): Promise<UserCreatedStreamObject> {
    logger.debug("Creating user in console %o", user.id);

    const result = await this.client.addUser(
      { code: company.id },
      {
        email: user.emailcanonical,
        firstName: user.firstname,
        lastName: user.lastname,
        password: passwordGenerator.generate({
          length: 10,
          numbers: true,
        }),
        // TODO
        role: "member",
      },
    );

    if (this.linkExternal) {
      await this.createUserLink(user, result, this.consoleId);
    }

    return {
      source: { user, company },
      destination: {
        id: result._id,
      },
    };
  }

  private async createUserLink(
    localUser: User,
    remoteUser: CreatedConsoleUser,
    serviceId: string,
  ): Promise<void> {
    logger.debug("Creating user link for user %s", localUser.id);
    if (this.dryRun) {
      return;
    }

    await this.userService.external.createExternalUser(
      getExternalUserInstance({
        service_id: serviceId,
        external_id: remoteUser._id,
        user_id: localUser.id,
      }),
    );
  }

  private async createCompanyLink(
    localCompany: Company,
    remoteCompany: CreatedConsoleCompany,
    serviceId: string,
  ): Promise<void> {
    logger.debug("Creating company link for company %s", localCompany.id);
    if (this.dryRun) {
      return;
    }

    await this.userService.external.createExternalGroup(
      getExternalGroupInstance({
        service_id: serviceId,
        company_id: localCompany.id,
        external_id: remoteCompany.code,
      }),
    );
  }
}
