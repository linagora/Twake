import { FastifyRequest, FastifyReply } from "fastify";
import { PreviewServiceAPI } from "../../api";

export class PreviewController {
  constructor(protected service: PreviewServiceAPI) {}

  async save(
    request: FastifyRequest<{
      Params: { company_id: string; id: string };
      Querystring: any;
    }>,
    response: FastifyReply
  ): Promise<any> {}

  async get(request: FastifyRequest<{}>, response: FastifyReply): Promise<any> {
    response.send("hello twake");
  }

  async delete(): Promise<void> {
    throw new Error("Not implemented");
  }
}
