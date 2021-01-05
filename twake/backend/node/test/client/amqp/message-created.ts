/**
 * Sample client to publish a message in the right channel like when a new message is published in a channel
 * From the project root: `./node_modules/.bin/ts-node ./test/client/amqp/message-created.ts`
 */
import { RabbitPubSub } from "../../../src/core/platform/services/pubsub/amqp";
import config from "../../../src/core/config";

const company_id = "bcfe2f79-8e81-42a3-b551-3a32d49b2b4c";
const workspace_id = "bcfe2f79-8e81-42a3-b551-3a32d49b2b4c";
const channel_id = "bcfe2f79-8e81-42a3-b551-3a32d49b2b4c";
const thread_id = "bcfe2f79-8e81-42a3-b551-3a32d49b2b4c";
const id = "bcfe2f79-8e81-42a3-b551-3a32d49b2b4c";
const sender = "bcfe2f79-8e81-42a3-b551-3a32d49b2b4c";

(async () => {
  const rabbit = await RabbitPubSub.get(config.get("pubsub.urls"));
  rabbit.publish("message:created", {
    data: {
      company_id,
      workspace_id,
      channel_id,
      thread_id,
      id,
      sender,
      creation_date: Date.now(),
      mentions: {
        users: [],
        specials: ["all"],
      },
    },
  });
})();
