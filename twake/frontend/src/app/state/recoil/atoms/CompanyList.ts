import { atom } from "recoil";
import { CompanyType } from "app/models/Company";

export const CompanyListState = atom<CompanyType[]>({
  key: 'CompanyListState',
  default: [],
});
