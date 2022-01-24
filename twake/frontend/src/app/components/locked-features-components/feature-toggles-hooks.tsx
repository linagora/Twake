import { useEffect } from 'react';
import FeatureTogglesService, { FeatureNames } from 'app/services/FeatureTogglesService';
import { FeatureToggles, Feature, withFeatures } from '@paralleldrive/react-feature-toggles';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';

export const useFeatureToggles = () => {
  const { activeFeatureNames } = FeatureTogglesService;
  const { company } = useCurrentCompany();

  useEffect(() => {
    const companyPlan = company?.plan;
    companyPlan && FeatureTogglesService.setFeaturesFromCompanyPlan(companyPlan as any);
  }, [company]);

  return {
    activeFeatureNames,
    FeatureToggles,
    Feature,
    withFeatures,
    FeatureNames,
  };
};
