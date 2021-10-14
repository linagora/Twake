import { atom, AtomEffect, useRecoilValue } from "recoil";

import { CompanyType } from "app/models/Company";
import UserContextState from "../../UserContextState";

const currentCompanyEffect: AtomEffect<CompanyType| undefined> = ({ onSet }) => {
  onSet(company => UserContextState.company = company);
};

export const CurrentCompanyState = atom<CompanyType | undefined>({
  key: 'CurrentCompanyState',
  default: undefined,
  effects_UNSTABLE: [
    currentCompanyEffect,
  ],
});
