export type JwtType = {
  sub: string;
  nbf: number;
  refresh_nbf: number;
  iat: number;
  org: {
    [companyId: string]: {
      role: string; //Not implemented
      wks: {
        [workspaceId: string]: {
          adm: boolean;
        };
      };
    };
  };
};
