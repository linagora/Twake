import { useRecoilValue, useSetRecoilState } from 'recoil';
import RouterService from 'app/features/router/services/router-service';
import { RouterState } from 'app/features/router/state/atoms/router';
import { RouterCompanySelector } from 'app/features/router/state/selectors/router-selector';

export default function useRouterCompany() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const companyId = useRecoilValue(RouterCompanySelector);

  return companyId;
}
