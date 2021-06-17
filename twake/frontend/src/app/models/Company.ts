export type CompanyRoleType = 'owner' | 'admin' | 'member' | 'guest';

export type CompanyStatusType = 'active' | 'deactivated' | 'invited';

export type CompanyBillingObjectType = {
  status: 'error' | string;
  trial_end: number;
};

export type CompanyLimitsObjectType = {
  members: number;
  guests: number;
  storage: number;
  guests_feature: boolean; //True to enable it, false to not enable it
  message_history_limit: number; //Delay in days
};

export type CompanyStatsObjectType = {
  created_at: number;
  total_members: number;
  total_guests: number;
  //Will be completed with Twake specific stats
};

export type CompanyPlanObjectType = {
  id: string;
  name: string;
  billing?: CompanyBillingObjectType;
  limits?: CompanyLimitsObjectType;
};

export type CompanyType = {
  id: string; //Related to console code
  name: string;
  logo: string;
  plan: CompanyPlanObjectType;
  stats: CompanyStatsObjectType;

  //If requested as a user
  role?: CompanyRoleType;
  status?: CompanyStatusType;
};
