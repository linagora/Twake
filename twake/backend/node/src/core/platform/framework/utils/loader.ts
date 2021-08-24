import { logger } from "../logger";
import fs from "fs";

export class Loader {
  constructor(readonly paths: string[]) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async load(componentName: string): Promise<any> {
    logger.info(`Loading ${componentName}`);
    const modulesPaths = this.paths.map(path => `${path}/${componentName}`);

    logger.debug(`Loading ${componentName} from ${modulesPaths.join(" - ")}`);

    let classes = await Promise.all(
      modulesPaths.map(async modulePath => {
        if (fs.existsSync(modulePath + "/index.js")) {
          //Fixme: probably a better way to handle this
          try {
            return await import(modulePath);
          } catch (err) {
            logger.debug({ err }, `${modulePath} can not be loaded`);
          }
        }
      }),
    );

    classes = classes.filter(Boolean);

    if (!classes || !classes.length) {
      throw new Error(`Can not find ${componentName} in any given path`);
    }

    return classes[0].default;
  }
}
