import { useRecoilValue } from "recoil";

import { CompanyType } from "app/models/Company";
import { CurrentCompanyState } from "../atoms/CurrentCompany";

export const useCurrentCompany = (): [CompanyType | undefined] => {
  const company = useRecoilValue(CurrentCompanyState);

  return [
    company,
  ];
};