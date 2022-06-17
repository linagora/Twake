import { MessageFile } from "./entities/message-files";
import { Message } from "./entities/messages";
import { MessageWithReplies } from "./types";

export const formatMessageFile = (file: MessageFile): MessageFile => {
  return {
    ...file,
    metadata: {
      ...file.metadata,
      thumbnails: [
        ...file.metadata.thumbnails.map(thumbnail => ({
          ...thumbnail,
          full_url: thumbnail.url.match(/https?:\/\//)
            ? "/internal/services/files/v1/" + thumbnail.url.replace(/^\//, "")
            : thumbnail.url,
        })),
      ],
    },
  };
};

export const formatMessage = (
  message: MessageWithReplies | Message,
): MessageWithReplies | Message => {
  return {
    ...message,
    files: message.files.map(formatMessageFile),
    ...((message as MessageWithReplies).last_replies
      ? { last_replies: (message as MessageWithReplies).last_replies.map(formatMessage) }
      : {}),
  };
};
