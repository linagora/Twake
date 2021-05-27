export type JwtType = {
  sub: string;
  provider_id: string; //Console sub
  email: string;
  application_id: string;
  server_request: boolean;
  nbf: number;
  refresh_nbf: number;
  iat: number;
};
