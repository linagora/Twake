import { Subject, combineLatest } from "rxjs";
import { filter } from "rxjs/operators";
import {
  logger,
  TwakeServiceFactory,
  TwakeContext,
  TwakeComponent,
  TwakeServiceState,
} from "../index";
import { Loader } from "./loader";

export function buildDependenciesTree(components: Map<string, TwakeComponent>): void {
  for (const [name, component] of components) {
    const dependencies: string[] = component.getServiceInstance().getConsumes() || [];

    dependencies.forEach(dependencyName => {
      if (name === dependencyName) {
        throw new Error(`There is a circular dependency for component ${dependencyName}`);
      }
      const dependencyComponent = components.get(dependencyName);

      if (!dependencyComponent) {
        throw new Error(
          `The component dependency ${dependencyName} has not been found for component ${name}`,
        );
      }

      component.addDependency(dependencyComponent);
    });
  }
}

/**
 * Load specified components from given list of paths
 *
 * @param paths Paths to search components in
 * @param names Components to load
 * @param context
 */
export async function loadComponents(
  paths: string[],
  names: string[] = [],
  context: TwakeContext,
): Promise<Map<string, TwakeComponent>> {
  const result = new Map<string, TwakeComponent>();
  const loader = new Loader(paths);

  const components: TwakeComponent[] = await Promise.all(
    names.map(async name => {
      const clazz = await loader.load(name);
      const component = new TwakeComponent(name, { clazz, name });
      result.set(name, component);

      return component;
    }),
  );

  await Promise.all(
    components.map(async component => {
      const service = await TwakeServiceFactory.create(
        component.getServiceDefinition().clazz,
        context,
        component.getServiceDefinition().name,
      );

      component.setServiceInstance(service);
    }),
  );

  return result;
}

export async function switchComponentsToState(
  components: Map<string, TwakeComponent>,
  state: TwakeServiceState.Initialized | TwakeServiceState.Started | TwakeServiceState.Stopped,
): Promise<void> {
  const states = [];

  for (const [name, component] of components) {
    logger.info(`Asking for ${state} on ${name} dependencies`);
    states.push(component.getServiceInstance().state);
    await component.switchToState(state);
  }

  logger.info(`All components are now in ${state} state`);
}
