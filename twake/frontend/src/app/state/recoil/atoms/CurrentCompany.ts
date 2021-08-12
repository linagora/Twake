import { atom, AtomEffect } from "recoil";

import { CompanyType } from "app/models/Company";
import UserContextState from "../../UserContextState";

const currentWorkspaceEffect: AtomEffect<CompanyType| undefined> = ({ onSet }) => {
  onSet(company => UserContextState.company = company);
};

export const CurrentCompanyState = atom<CompanyType | undefined>({
  key: 'CurrentCompanyState',
  default: undefined,
  effects_UNSTABLE: [
    currentWorkspaceEffect,
  ],
});
