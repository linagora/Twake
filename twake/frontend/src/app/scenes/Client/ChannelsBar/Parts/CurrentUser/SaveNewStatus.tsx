import React from 'react';

import Button from 'components/Buttons/Button.js';
import Languages from 'services/languages/languages';

import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';

type PropsType = {
  status: string[];
  updateStatus: (newStatus: string[]) => void;
};

export default (props: PropsType): JSX.Element => {
  const { updateStatus } = useCurrentUser();

  return (
    <div className="menu-buttons">
      <Button
        disabled={props.status.length <= 0}
        type="button"
        value={Languages.t('scenes.app.channelsbar.currentuser.update', [], 'Mettre à jour')}
        onClick={() => {
          props.updateStatus([props.status[0], props.status[1]]);
          updateStatus([props.status[0], props.status[1]]);
        }}
      />
    </div>
  );
};
