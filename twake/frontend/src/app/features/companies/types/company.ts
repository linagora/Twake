export type CompanyRoleType = 'owner' | 'admin' | 'member' | 'guest';

export type CompanyStatusType = 'active' | 'deactivated' | 'invited';

export type CompanyBillingObjectType = {
  status: 'error' | 'warning' | string;
  trial_end: number;
};

export enum CompanyLimitsEnum {
  CHAT_MESSAGE_HISTORY_LIMIT = 'chat:message_history_limit',
  COMPANY_MEMBERS_LIMIT = 'company:members_limit', // 100
}

export type CompanyLimitsObjectType = {
  [CompanyLimitsEnum.CHAT_MESSAGE_HISTORY_LIMIT]: number;
  [CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT]: number;
};

export type CompanyStatsObjectType = {
  created_at: number;
  total_members: number;
  total_guests: number;
  total_messages: number;
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
  mininame?: string;
  logo: string;
  plan?: CompanyPlanObjectType;
  stats?: CompanyStatsObjectType;

  //If requested as a user
  role?: CompanyRoleType;
  status?: CompanyStatusType;
};
