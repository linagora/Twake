import Company from "./entities/company";
import {
  CompanyFeaturesEnum,
  CompanyLimitsEnum,
  CompanyObject,
  CompanyStatsObject,
  CompanyUserObject,
} from "./web/types";

export function formatCompany(
  companyEntity: Company,
  companyUserObject?: CompanyUserObject,
  companyStats?: CompanyStatsObject,
): CompanyObject {
  const res: CompanyObject = {
    id: companyEntity.id,
    name: companyEntity.name || "",
    logo: companyEntity.logo || "",
    plan: companyEntity.plan,
    identity_provider: companyEntity.identity_provider,
    identity_provider_id: companyEntity.identity_provider_id,
  };

  if (companyUserObject) {
    res.status = "active"; // FIXME: Deactivated console user are removed from company on twake side
    res.role = companyUserObject.role;
  }

  if (companyStats) {
    res.stats = companyStats;
  }

  res.plan = {
    name: res.plan?.name || "free",
    limits: res.plan?.limits || {},
    features: res.plan?.features || {},
  };

  res.plan.limits = Object.assign(
    {
      [CompanyLimitsEnum.CHAT_MESSAGE_HISTORY_LIMIT]: 10000,
      [CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT]: -1,
      [CompanyLimitsEnum.COMPANY_GUESTS_LIMIT]: -1,
    },
    res.plan?.limits || {},
  );

  res.plan.features = Object.assign(
    {
      [CompanyFeaturesEnum.CHAT_GUESTS]: true,
      [CompanyFeaturesEnum.CHAT_MESSAGE_HISTORY]: true,
      [CompanyFeaturesEnum.CHAT_MULTIPLE_WORKSPACES]: true,
      [CompanyFeaturesEnum.CHAT_EDIT_FILES]: true,
      [CompanyFeaturesEnum.CHAT_UNLIMITED_STORAGE]: true,
      [CompanyFeaturesEnum.COMPANY_INVITE_MEMBER]: true,
    },
    {
      ...(res.plan?.features || {}),
      [CompanyFeaturesEnum.COMPANY_INVITE_MEMBER]:
        res.plan?.limits[CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT] <= 0 ||
        res.stats.total_members < res.plan?.limits[CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT],
    },
  );

  return res;
}

export function getCompanyStats(company: Company, total_messages: number = 0): CompanyStatsObject {
  return {
    created_at: company.dateAdded,
    total_members: company.stats?.total_members || 0,
    total_guests: company.stats?.total_guests || 0,
    total_messages,
  };
}
