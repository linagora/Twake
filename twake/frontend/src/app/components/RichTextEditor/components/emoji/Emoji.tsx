import React from "react";

export const Emoji = (props: any) => {
  console.log("PROPS EMOJI", props);
  return <span className='label suggestion'>
    { props.children }
  </span>
}
