import React from 'react';
import Languages from 'app/features/global/services/languages-service';

export default () => {
  return (
    <div className="main-view">
      <div className="no-channel-text">
        {Languages.t(
          'scenes.app.mainview.instruction_current_tab',
          [],
          'Commencez par sélectionner une chaîne sur votre gauche.',
        )}
      </div>
    </div>
  );
};
