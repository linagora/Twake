import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import {
  IncomingMessageQueueMessage,
  MessageQueueHandler,
  MessageQueueServiceAPI,
  MessageQueueServiceProcessor,
} from "../../../../../../src/core/platform/services/message-queue/api";

describe("The MessageQueueServiceProcessor class", () => {
  let pubsubService: MessageQueueServiceAPI;
  let subscribe;
  let publish;
  let topic;
  let errorTopic;
  let outTopic;

  beforeEach(() => {
    topic = "inputtopic";
    errorTopic = "errorTopic";
    outTopic = "outTopic";
    subscribe = jest.fn();
    publish = jest.fn();
    pubsubService = {
      publish,
      subscribe,
    } as unknown as MessageQueueServiceAPI;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe("The init function", () => {
    it("should not subscribe when topics is not defined", async () => {
      subscribe.mockResolvedValue(true);
      const processor = new MessageQueueServiceProcessor(
        {} as MessageQueueHandler<unknown, unknown>,
        pubsubService,
      );

      await processor.init();
      expect(subscribe).not.toHaveBeenCalled;
    });

    it("should not subscribe when topics.in is not defined", async () => {
      subscribe.mockResolvedValue(true);
      const processor = new MessageQueueServiceProcessor(
        {
          topics: {},
        } as MessageQueueHandler<unknown, unknown>,
        pubsubService,
      );

      await processor.init();
      expect(subscribe).not.toHaveBeenCalled;
    });

    it("should subscribe when topics.in is defined", async () => {
      subscribe.mockResolvedValue(true);
      const processor = new MessageQueueServiceProcessor(
        {
          topics: {
            in: topic,
          },
        } as MessageQueueHandler<unknown, unknown>,
        pubsubService,
      );

      await processor.init();
      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(subscribe).toHaveBeenCalledWith(topic, expect.any(Function), undefined);
    });
  });

  describe("The function handling incoming messages", () => {
    describe("When handler.validate is defined", () => {
      it("should not process data when data is not valid", async () => {
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        const validate = jest.fn().mockReturnValue(false);
        const process = jest.fn().mockReturnValue(true);
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
            },
            validate,
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(validate).toBeCalledTimes(1);
        expect(validate).toBeCalledWith(message.data);
        expect(process).not.toHaveBeenCalled;
      });

      it("should process data when data is valid", async () => {
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        const validate = jest.fn().mockReturnValue(true);
        const process = jest.fn().mockReturnValue(true);
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
            },
            validate,
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(validate).toBeCalledTimes(1);
        expect(validate).toBeCalledWith(message.data);
        expect(process).toHaveBeenCalled;
      });
    });

    describe("When processing message", () => {
      it("should not publish error when topics.error is not defined", async () => {
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        const process = jest.fn().mockRejectedValue(new Error("I failed to process"));
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
            },
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(process).toBeCalledTimes(1);
        expect(process).toHaveBeenCalledWith(message.data);
        expect(publish).not.toBeCalled;
      });

      it("should publish error when topics.error is defined", async () => {
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        const process = jest.fn().mockRejectedValue(new Error("I failed to process"));
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
              error: errorTopic,
            },
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(process).toBeCalledTimes(1);
        expect(process).toHaveBeenCalledWith(message.data);
        expect(publish).toBeCalledTimes(1);
        expect(publish).toBeCalledWith(errorTopic, expect.anything());
      });

      it("should not publish when processing does not return result", async () => {
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const process = jest.fn().mockResolvedValue(null);
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
              out: outTopic,
              error: errorTopic,
            },
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(process).toBeCalledTimes(1);
        expect(process).toHaveBeenCalledWith(message.data);
        expect(publish).not.toBeCalled;
      });

      it("should not publish when out topic is not defined", async () => {
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const process = jest.fn().mockResolvedValue(true);
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
              error: errorTopic,
            },
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(process).toBeCalledTimes(1);
        expect(process).toHaveBeenCalledWith(message.data);
        expect(publish).not.toBeCalled;
      });

      it("should publish when out topic is defined and process returns result", async () => {
        const result = "processing result";
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const process = jest.fn().mockResolvedValue(result);
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
              error: errorTopic,
              out: outTopic,
            },
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(process).toBeCalledTimes(1);
        expect(process).toHaveBeenCalledWith(message.data);
        expect(publish).toBeCalledTimes(1);
        expect(publish).toBeCalledWith(
          outTopic,
          expect.objectContaining({
            data: result,
          }),
        );
      });

      it("should publish error when result can not be published", async () => {
        publish.mockRejectedValue(new Error("I failed to publish"));
        const result = "processing result";
        const message = {
          data: "foo",
        } as IncomingMessageQueueMessage<string>;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const process = jest.fn().mockResolvedValue(result);
        const processor = new MessageQueueServiceProcessor(
          {
            topics: {
              in: topic,
              error: errorTopic,
              out: outTopic,
            },
            process,
          } as unknown as MessageQueueHandler<unknown, unknown>,
          pubsubService,
        );

        await processor.init();
        const processMessage = subscribe.mock.calls[0][1];
        await processMessage(message);

        expect(process).toBeCalledTimes(1);
        expect(process).toHaveBeenCalledWith(message.data);
        expect(publish).toBeCalledTimes(2);
        expect(publish.mock.calls[0][0]).toEqual(outTopic);
        expect(publish.mock.calls[1][0]).toEqual(errorTopic);
      });
    });
  });
});
