import { logger } from "../logger";

export class Loader {
  constructor(readonly path: string) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async load(className: string): Promise<any> {
    const modulePath = `${this.path}/${className}`;

    logger.debug("Loading %s", modulePath);
    const clazz = await import(modulePath);

    return clazz.default;
  }
}
