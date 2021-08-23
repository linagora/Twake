import Emojione from "app/components/Emojione/Emojione";
import React from "react";
import { ChannelSuggestionType } from "./index";

export default (props: ChannelSuggestionType): JSX.Element => {
  return (
     <>
      <div className="icon">
        <Emojione type={props.icon || ""} />
      </div>
      <div className="text">{props.name}</div>
     </>
  );
}