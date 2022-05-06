import React from 'react';
import Moment from 'react-moment';
import 'moment-timezone';
import './message.scss';

type Props = {
  date: number;
};

export default React.memo((props: Props) => {
  return (
    <div className="time_separator">
      <div className="message_timeline">
        <div className="time_container">
          <div className="time">
            {new Date().getTime() - props.date > 24 * 60 * 60 * 1000 ? (
              <Moment date={props.date || 0} format="LL"></Moment>
            ) : (
              <Moment date={props.date || 0} fromNow></Moment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
