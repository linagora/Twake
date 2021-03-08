import passwordGenerator from "generate-password";
import { concat, EMPTY, from, Observable, ReplaySubject } from "rxjs";
import { distinct, filter, map, mergeMap } from "rxjs/operators";
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
import CompanyUser from "../../user/entities/company_user";
import { ConsoleHTTPClient } from "../client";
import { ConsoleServiceClient } from "../api";

const logger = getLogger("console.process.merge");

export class MergeProcess {
  private client: ConsoleServiceClient;

  constructor(
    private userService: UserServiceAPI,
    private dryRun: boolean,
    private consoleId: string = "console",
    private linkExternal: boolean = false,
    consoleClientParameters: {
      url: string;
      client: string;
      secret: string;
    },
  ) {
    this.client = new ConsoleHTTPClient(consoleClientParameters, dryRun);
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
      filter(company => !company.error),
      mergeMap(company =>
        this.getUserIds(company.source).pipe(
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

  private getUserIds(company: Company, paginable?: Paginable): Observable<CompanyUser> {
    return from(this.userService.companies.getUsers({ group_id: company.id }, paginable)).pipe(
      mergeMap(companyUsers => {
        const items$ = from(companyUsers.getEntities());
        const next$ = companyUsers?.nextPage?.page_token
          ? this.getUserIds(company, companyUsers.nextPage)
          : EMPTY;
        return concat(items$, next$);
      }),
      distinct(user => user.user_id),
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
    let createdCompany: CreatedConsoleCompany;
    let error;

    try {
      createdCompany = await this.client.createCompany({
        code: company.id,
        displayName: company.displayName,
        // TODO
        status: "todo",
      });

      if (this.linkExternal) {
        await this.createCompanyLink(company, createdCompany, this.consoleId);
      }
    } catch (err) {
      logger.warn("Error while creating company %s", company.displayName);
      error = err;
    }

    return {
      source: company,
      destination: {
        code: createdCompany?.code,
      },
      error,
    };
  }

  private async createUser(
    company: Company,
    companyUser: CompanyUser,
  ): Promise<UserCreatedStreamObject> {
    logger.debug("Creating user in console %o", companyUser.user_id);
    let error: Error;
    let result: CreatedConsoleUser;

    try {
      const user = await this.userService.users.get({ id: companyUser.user_id });

      if (!user) {
        throw new Error(`User ${companyUser.user_id} not found`);
      }

      result = await this.client.addUser(
        { code: company.id },
        {
          email: user.emailcanonical,
          firstName: user.firstname,
          lastName: user.lastname,
          password: passwordGenerator.generate({
            length: 10,
            numbers: true,
          }),
          role: companyUser.level == 0 ? "member" : "admin",
        },
      );

      if (this.linkExternal) {
        await this.createUserLink(user, result, this.consoleId);
      }
    } catch (err) {
      logger.warn("Error while creating the user %o", companyUser.user_id);
      error = err;
    }

    return {
      source: { user: companyUser, company },
      destination: {
        id: result?._id,
        companyCode: company.id,
      },
      error,
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
