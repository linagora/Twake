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
  public activeFeatureNames: string[];

  constructor() {
    this.activeFeatureNames = [];
  }

  public setFeaturesFromCompanyPlan(plan: { [key: string]: boolean }): void {
    availableFeatures.forEach(featureName =>
      this.addOrRemoveActiveFeatureName(featureName, plan[featureName]),
    );
  }

  private addOrRemoveActiveFeatureName(featureName: string, isActive: boolean): void {
    const shouldAddFeature = !this.activeFeatureNames.includes(featureName) && isActive === true;
    if (shouldAddFeature) this.activeFeatureNames.push(featureName);

    const shouldRemoveFeature = this.activeFeatureNames.includes(featureName) && isActive === false;
    if (shouldRemoveFeature)
      this.activeFeatureNames = this.activeFeatureNames.filter(name => name !== featureName);
  }
}

export default new FeatureTogglesService();
