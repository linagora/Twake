import React from "react";

export const Emoji = (props: any) => {
  return <span className='label suggestion'>
    { props.children }
  </span>;
};
