import React from 'react';

type PropsType = { title: string; active: boolean; onClick: any };

export default ({ active, title, onClick }: PropsType): JSX.Element => {
  const activeClass = active ? 'tab-item-active' : 'tab-item';

  const itemClicked = () => {
    if (!active) {
      onClick();
    }
  };

  return (
    <div className="tab-item-wrapper" onClick={itemClicked}>
      <div className={activeClass}>
        <div className="tab-item-title">{title}</div>
        <div className="tab-item-indicator"></div>
      </div>
    </div>
  );
};
