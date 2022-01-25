import { useEffect, useRef } from 'react';
import LoginService from 'app/services/login/LoginService';
import UserAPIClient from 'app/services/user/UserAPIClient';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../atoms/CurrentUser';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import { UserType } from 'app/models/User';
import Languages from 'services/languages/languages';
import ConfiguratorsManager from "services/Configurators/ConfiguratorsManager";
import { RealtimeApplicationEvent } from "services/Realtime/types";

export const useCurrentUser = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);

  //Depreciated way to get use update from LoginService
  LoginService.recoilUpdateUser = setUser;
  useEffect(() => {
    if (!user) {
      LoginService.init();
    }
  }, [user]);

  //Update app language
  useEffect(() => {
    if (user?.preference?.locale) Languages.setLanguage(user?.preference?.locale);
  }, [user?.preference?.locale]);

  const updateStatus = async (userStatus: string[]) => {
    await UserAPIClient.updateUserStatus(`${userStatus[0]} ${userStatus[1]}`);

    await refresh();
  };

  const refresh = async () => {
    await LoginService.updateUser();
  };

  return { user, refresh, updateStatus };
};



const applicationEventHandler = (event: RealtimeApplicationEvent)=>{
    console.log("!!!***", event.action, event.application,event.form, event.hidden_data);

    switch (event.action){
      case 'configure':
        ConfiguratorsManager.openConfigurator(event.application, event.form, event.hidden_data);
        break;
      case 'close_configure':
        ConfiguratorsManager.closeConfigurator(event.application);
        break;
      default:
        console.error("Wrong application action");
    }

};


export const useCurrentUserRealtime = () => {
  const { user, refresh } = useCurrentUser();
  const room = UserAPIClient.websocket(user?.id || '');

  const timeout = useRef(0);

  useRealtimeRoom<any>(room, 'useCurrentUser', async (action, resource) => {

    switch(resource._type){
      case 'user':
        clearTimeout(timeout.current); //
        timeout.current = setTimeout(() => {
          refresh();
        }, 1000) as any;
        break;
      case 'application':
        applicationEventHandler(resource);
        break;
      default: console.error("Unknown resource type");

    }





  });

  // useRealtimeRoom<any>(room, 'hz', async (action, data:RealtimeApplicationEvent) => {

  // });

};
