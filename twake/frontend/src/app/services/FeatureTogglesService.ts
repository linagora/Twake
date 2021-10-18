// Define feature names here
export enum FeatureNames {
  GUESTS = "chat:guests",
  MESSAGE_HISTORY = "chat:message_history",
  MESSAGE_HISTORY_LIMIT = "chat:message_history_limit",
  MULTIPLE_WORKSPACES = "chat:multiple_workspaces",
  EDIT_FILES = "chat:edit_files",
  UNLIMITED_STORAGE = "chat:unlimited_storage", //Currently inactive
}

export type FeatureValueType = boolean | number;

const availableFeaturesWithDefaults = new Map<FeatureNames, any>();

// Define available features with defaults here
availableFeaturesWithDefaults.set(FeatureNames.GUESTS, true);
availableFeaturesWithDefaults.set(FeatureNames.MESSAGE_HISTORY, true);
availableFeaturesWithDefaults.set(FeatureNames.MESSAGE_HISTORY_LIMIT, 10000);
availableFeaturesWithDefaults.set(FeatureNames.MULTIPLE_WORKSPACES, true);
availableFeaturesWithDefaults.set(FeatureNames.EDIT_FILES, true);
availableFeaturesWithDefaults.set(FeatureNames.UNLIMITED_STORAGE, true);


/**
 * Service that allow you to manage feature flipping in Twake using react feature toggles
 */
class FeatureTogglesService {
  public activeFeatureNames: FeatureNames[];
  private activeFeatureValues: Map<FeatureNames, FeatureValueType>;

  constructor() {
    this.activeFeatureNames = [];
    this.activeFeatureValues = new Map<FeatureNames,FeatureValueType>();
  }

  public setFeaturesFromCompanyPlan(plan: { features: { [key: string]: FeatureValueType } }): void {
    for (let [featureName, defaultValue] of availableFeaturesWithDefaults) {
      this.setActiveFeatureName(
        featureName,
        plan.features[featureName] !== undefined ? plan.features[featureName] : defaultValue
      );
    }
  }

  private setActiveFeatureName(featureName: FeatureNames, value: FeatureValueType): void {

    if (typeof value === "boolean") {
      const shouldAddFeature = value && !this.isActiveFeatureName(featureName);
      if (shouldAddFeature) this.activeFeatureNames.push(featureName);

      const shouldRemoveFeature = !value && this.isActiveFeatureName(featureName);
      if (shouldRemoveFeature)
        this.activeFeatureNames = this.activeFeatureNames.filter(name => name !== featureName);
    } else {
      this.activeFeatureValues.set(featureName, value);
    }
  }

  public isActiveFeatureName(featureName: FeatureNames) {
    return this.activeFeatureNames.includes(featureName);
  }

  public getFeatureValue<T>(featureName: FeatureNames): T{
    return this.activeFeatureValues.get(featureName) as unknown as T;
  }

}

export default new FeatureTogglesService();
