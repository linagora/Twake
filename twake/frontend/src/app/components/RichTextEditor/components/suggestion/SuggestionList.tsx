import React, { useState } from "react";
import "./SuggestionList.scss";

type Props<T> = {
  list: Array<T & {autocomplete_id?: number}> | undefined;
  position: any;
  renderItem: (item: T) => any;
  onSelected: (item: T) => void;
  disableNavigationKey?: boolean;
  selectedIndex: number;
}

export const SuggestionList = <T, >(props: Props<T>): JSX.Element => {
  const [isFocused, setFocused] = useState(false);

  const select = (item: T) => {
    item && props.onSelected(item);
  }

  return (
    <div
      className={
        'menu-list as_frame inline ' +
        (isFocused && props.list?.length ? 'fade_in ' : '') +
        //props.position
        'top'
      }
    >
      {props.list?.map((item, index) => {
        return (
          <div
            key={index}
            className={`menu ${(!props.disableNavigationKey && item.autocomplete_id === props.selectedIndex ? 'is_selected' : '')}`}
            onClick={() => select(item)}
            onMouseDown={() => select(item)}
            onFocus={() => console.log("FOCUS", item)}
          >
            { item && props.renderItem(item) }
          </div>
        );
      })}
    </div>
  )
}