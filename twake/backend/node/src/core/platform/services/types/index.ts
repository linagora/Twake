export type JwtType = {
  sub: string;
  provider_id: string; //Console sub
  email: string;
  nbf: number;
  refresh_nbf: number;
  iat: number;
};
