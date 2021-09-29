// Define feature names here
export enum FeatureNames {
  GUESTS = 'chat:guests',
  MESSAGE_HISTORY = 'chat:message_history',
  MULTIPLE_WORKSPACES = 'chat:multiple_workspaces',
  EDIT_FILES = 'chat:edit_files',
  UNLIMITED_STORAGE = 'chat:unlimited_storage', //Currently inactive
}

// Define available features here
const availableFeatures = [
  FeatureNames.GUESTS,
  FeatureNames.MESSAGE_HISTORY,
  FeatureNames.MULTIPLE_WORKSPACES,
  FeatureNames.EDIT_FILES,
  FeatureNames.UNLIMITED_STORAGE,
];

/**
 * Service that allow you to manage feature flipping in Twake using react feature toggles
 */
class FeatureTogglesService {
  public activeFeatureNames: FeatureNames[];

  constructor() {
    this.activeFeatureNames = [];
  }

  public setFeaturesFromCompanyPlan(plan: { features: { [key: string]: boolean } }): void {
    availableFeatures.forEach(featureName => {
      return this.setActiveFeatureName(
        featureName,
        plan.features[featureName] !== undefined ? plan.features[featureName] : true,
      );
    });
  }

  private setActiveFeatureName(featureName: FeatureNames, isActive: boolean): void {
    const shouldAddFeature = isActive === true && !this.isActiveFeatureName(featureName);
    if (shouldAddFeature) this.activeFeatureNames.push(featureName);

    const shouldRemoveFeature = isActive === false && this.isActiveFeatureName(featureName);
    if (shouldRemoveFeature)
      this.activeFeatureNames = this.activeFeatureNames.filter(name => name !== featureName);
  }

  public isActiveFeatureName(featureName: FeatureNames) {
    return this.activeFeatureNames.includes(featureName);
  }
}

export default new FeatureTogglesService();
