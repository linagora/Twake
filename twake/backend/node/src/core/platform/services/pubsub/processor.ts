import { logger } from "../../framework";
import { PubsubHandler, PubsubServiceAPI, PubsubServiceProcessor } from "./api";

const LOG_PREFIX = "service.pubsub.Processor";

export class Processor {
  // TODO: Add state
  private registry: ProcessorRegistry;

  constructor(private pubsub: PubsubServiceAPI) {
    this.registry = new ProcessorRegistry(this.pubsub);
  }

  async init(): Promise<this> {
    return this;
  }

  async start(): Promise<void> {
    await Promise.all(
      Array.from(this.registry.processors.keys()).map(async name => {
        logger.info(`${LOG_PREFIX} - Starting notification processor ${name}`);
        await this.registry.processors.get(name)?.init();
        logger.info(`${LOG_PREFIX} - notification processor ${name} is started`);
      }),
    );
  }

  async stop(): Promise<void> {
    await Promise.all(
      Array.from(this.registry.processors.keys()).map(async name => {
        this.removeHandler(name);
      }),
    );
  }

  addHandler<In, Out>(handler: PubsubHandler<In, Out>): void {
    // TODO: Start the handler if added when service is already started
    if (!handler) {
      throw new Error(`${LOG_PREFIX} - Can not add null handler`);
    }

    logger.info(`${LOG_PREFIX} - Adding pubsub handler ${handler.name}`);
    this.registry.register(handler);
  }

  async startHandler(name: string): Promise<void> {
    logger.info(`${LOG_PREFIX} - Starting pubsub handler ${name}`);
    await this.registry.processors.get(name)?.init();
  }

  stopHandler(name: string): void {
    logger.info(`${LOG_PREFIX} - Stopping pubsub handler ${name}`);
    this.registry.processors.get(name)?.stop();
  }

  removeHandler(name: string): void {
    logger.info(`${LOG_PREFIX} - Removing pubsub handler ${name}`);
    this.stopHandler(name);
    this.registry.processors.delete(name);
  }
}

class ProcessorRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processors: Map<string, PubsubServiceProcessor<any, any>>;

  constructor(private pubsub: PubsubServiceAPI) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.processors = new Map<string, PubsubServiceProcessor<any, any>>();
  }

  register<In, Out>(handler: PubsubHandler<In, Out>): void {
    if (!handler) {
      throw new Error("Can not add a null handler");
    }
    this.processors.set(handler.name, new PubsubServiceProcessor<In, Out>(handler, this.pubsub));
  }
}
