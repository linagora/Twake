import { useRecoilValue } from "recoil";
import { CurrentUserState } from "app/state/recoil/atoms/CurrentUser";

const useCurrentUser = () => useRecoilValue(CurrentUserState);

export default useCurrentUser;
