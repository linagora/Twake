import React, { useEffect } from 'react';
import FeatureTogglesService, {
  FeatureNames,
  FeatureValueType,
} from 'app/services/FeatureTogglesService';
import Groups from 'services/workspaces/groups.js';
import { FeatureToggles, Feature, withFeatures } from '@paralleldrive/react-feature-toggles';

export const useFeatureToggles = () => {
  const { activeFeatureNames } = FeatureTogglesService;
  const companyId = Groups.currentGroupId;
  const userGroups: { [key: string]: any } = Groups.user_groups;

  Groups.useListener();

  useEffect(() => {
    const companyPlan: { features: { [key: string]: FeatureValueType } } =
      userGroups[companyId]?.plan;
    companyPlan && FeatureTogglesService.setFeaturesFromCompanyPlan(companyPlan);
  });

  return {
    activeFeatureNames,
    FeatureToggles,
    Feature,
    withFeatures,
    FeatureNames,
  };
};
