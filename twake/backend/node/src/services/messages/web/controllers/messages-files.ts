import gr from "../../../global-resolver";
import { FastifyRequest, FastifyReply } from "fastify";

export class MessagesFilesController {
  async deleteMessageFile(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        message_id: string;
        message_file_id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const user = request.currentUser;
    const resp = await gr.services.messages.messagesFiles.deleteMessageFile(
      request.params.message_id,
      request.params.message_file_id,
      user.id,
    );

    if (!resp) reply.code(404).send();

    reply.send({ resource: resp });
  }

  async getMessageFile(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        message_id: string;
        message_file_id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const user = request.currentUser;
    const resp = await gr.services.messages.messagesFiles.getMessageFile(
      request.params.message_id,
      request.params.message_file_id,
    );

    if (!resp) reply.code(404).send();

    //Check user has access to this file (check access to channel)
    if (!(await gr.services.channels.members.getChannelMember(user, resp.channel))) {
      reply.code(403).send();
    }

    reply.send({ resource: resp });
  }
}
