import { Button } from 'antd';
import ObjectModal from 'app/components/ObjectModal/ObjectModal';
import React from 'react';
import ModalManager from 'app/components/Modal/ModalManager';
import Languages from 'services/languages/languages.js';
import Emojione from 'app/components/Emojione/Emojione';

type PropsType = {
  pricingPlanUrl: string;
};

const LockedGuestsPopup = ({ pricingPlanUrl }: PropsType): JSX.Element => {
  const onClickLearnMore = () => window.open(pricingPlanUrl, 'blank');
  const onClickSkipForNow = () => ModalManager.close();

  return (
    <ObjectModal
      title={
        <>
          <Emojione type=":lock:" s64 />
          {Languages.t('components.locked_features.locked_guests_popup.title')}
        </>
      }
      footer={
        <>
          <Button type="primary" onClick={onClickLearnMore}>
            {Languages.t('components.locked_features.locked_guests_popup.learn_more_button')}
          </Button>
          <Button type="ghost" className="small-left-margin" onClick={onClickSkipForNow}>
            {Languages.t('components.locked_features.locked_guests_popup.skip_for_now_button')}
          </Button>
        </>
      }
    >
      <div className="x-margin">
        {Languages.t('components.locked_features.locked_guests_popup.description')}
      </div>
    </ObjectModal>
  );
};

export default LockedGuestsPopup;
