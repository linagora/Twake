import RouterService from 'app/services/RouterService';
import { RouterCompanySelector, RouterState } from 'app/state/recoil/atoms/Router';
import { useRecoilValue, useSetRecoilState } from 'recoil';

export default function useRouterCompany() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const companyId = useRecoilValue(RouterCompanySelector);

  return companyId;
}
