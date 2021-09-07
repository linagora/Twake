// Define feature names here
export enum FeatureNames {
  GUESTS = 'guests',
  MESSAGE_HISTORY = 'message_history',
  MULTIPLE_WORKSPACES = 'multiple_workspaces',
  ONLY_OFFICE = 'app_only_office',
  UNLIMITED_STORAGE = 'unlimited_storage',
}

// Define available features here
const availableFeatures = [
  FeatureNames.GUESTS,
  FeatureNames.MESSAGE_HISTORY,
  FeatureNames.MULTIPLE_WORKSPACES,
  FeatureNames.ONLY_OFFICE,
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

  public setFeaturesFromCompanyPlan(plan: { [key: string]: boolean }): void {
    availableFeatures.forEach(featureName => {
      return this.setActiveFeatureName(
        featureName,
        plan[featureName] !== undefined ? plan[featureName] : true,
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
