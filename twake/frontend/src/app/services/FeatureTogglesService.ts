// Define feature names here
export enum FeatureNames {
  GUESTS = 'guests',
  MESSAGE_HISTORY = 'message_history',
  ONLY_OFFICE = 'only_office',
  PENDING_EMAILS = 'pending_emails',
  FILE_ENCRYPTION = 'file_encryption',
  CALENDAR = 'calendar',
  JITSI = 'jitsi',
}

// Define available features here
const availableFeatures = [
  FeatureNames.GUESTS,
  FeatureNames.MESSAGE_HISTORY,
  FeatureNames.ONLY_OFFICE,
  FeatureNames.PENDING_EMAILS,
  FeatureNames.FILE_ENCRYPTION,
  FeatureNames.CALENDAR,
  FeatureNames.JITSI,
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
