/* eslint-disable react/prop-types */
import React from 'react';
import AppsIcon from '@material-ui/icons/Apps';
import Popover from '@material-ui/core/Popover';
import IconButton from '@material-ui/core/IconButton';

export default function Apps(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <IconButton aria-describedby={id} variant="contained" color="primary" onClick={handleClick}>
        <AppsIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div className="integration-apps">
          {props.apps.map(item => (
            <a className="app" target="_BLANK" rel="noreferrer" href={item.url} key={item.url}>
              <div className="image" style={{ backgroundImage: 'url(' + item.icon + ')' }} />
              <div className="app-title">{item.name}</div>
            </a>
          ))}
        </div>
      </Popover>
    </div>
  );
}
