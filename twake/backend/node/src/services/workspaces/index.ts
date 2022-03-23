import { Prefix, TwakeService } from "../../core/platform/framework";
import WorkspaceService from "./api";

import gr from "../global-resolver";

@Prefix("/internal/services/workspaces/v1")
export default class Service extends TwakeService<WorkspaceService> {
  version = "1";
  name = "workspaces";
  private service: WorkspaceService;

  public async doInit(): Promise<this> {
    gr.registerEndpoint(this.context, this.prefix);
    return this;
  }

  api(): WorkspaceService {
    return this.service;
  }
}
