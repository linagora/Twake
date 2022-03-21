import { AccessToken } from "../../../utils/types";
import { ExecutionContext } from "../../../core/platform/framework/api/crud-service";

export interface ApplicationApiBaseRequest {
  id: string;
  secret: string;
}

export type ApplicationLoginRequest = ApplicationApiBaseRequest;

export interface ApplicationLoginResponse {
  access_token: AccessToken;
}

export interface ApplicationApiExecutionContext extends ExecutionContext {
  application_id: string;
}

export interface ConfigureRequest {
  user_id: string;
  connection_id: string;
  form?: any;
}
