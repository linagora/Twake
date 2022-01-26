import React from "react";

export const Command = (props: any) => {
  return <span className='label suggestion'>
    { props.children }
  </span>;
};
