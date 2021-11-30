import { useRecoilValue, useSetRecoilState } from 'recoil';
import RouterService from 'app/services/RouterService';
import { RouterState } from 'app/state/recoil/atoms/Router';
import { RouterCompanySelector } from '../selectors/RouterSelector';

export default function useRouterCompany() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const companyId = useRecoilValue(RouterCompanySelector);
  return companyId;
}
