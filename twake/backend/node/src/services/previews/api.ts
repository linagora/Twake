import { PubsubHandler } from "../../core/platform/services/pubsub/api";

/**
 * A notification hander is in charge of processing a notification from the pubsub layer and then optionally produces something to be consumed by another handler somewhere in the platform.
 */
export type PreviewPubsubHandler<InputMessage, OutputMessage> = PubsubHandler<
  InputMessage,
  OutputMessage
>;
