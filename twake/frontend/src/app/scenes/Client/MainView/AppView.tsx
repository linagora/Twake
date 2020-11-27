import RouterService from 'app/services/RouterService';
import React, { FC } from 'react';

type PropsType = {};

const AppView: FC<PropsType> = props => {
  const { channelId } = RouterService.useStateFromRoute();

  return <div>This is an app view for channel {channelId} :)</div>;
};

export default AppView;
