import React from 'react';
import './WritingLoader.scss';

export default (): JSX.Element => {
  return (
    <div className="col-3">
      <div className="snippet" data-title=".dot-typing">
        <div className="stage">
          <div className="dot-typing"></div>
        </div>
      </div>
    </div>
  );
};
