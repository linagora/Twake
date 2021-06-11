import React, { useState, CSSProperties } from "react";
import classNames from "classnames";
import "./SuggestionList.scss";

type Props<T> = {
  list: Array<T & {autocomplete_id?: number}> | undefined;
  renderItem: (item: T) => any;
  onSelected: (item: T) => void;
  disableNavigationKey?: boolean;
  selectedIndex: number;
  position: DOMRect | null;
  editorPosition: DOMRect | null;
  suggestionWitdh?: number;
  suggestionMargin?: number;
}

const DEFAULT_SUGGESTION_WIDTH = 400;
const DEFAULT_SUGGESTION_MARGIN = 20;

export const SuggestionList = <T, >(props: Props<T>): JSX.Element => {
  const suggestionWidth = props.suggestionWitdh || DEFAULT_SUGGESTION_WIDTH;
  const suggestionMargin = props.suggestionMargin ||DEFAULT_SUGGESTION_MARGIN;
  const [isFocused] = useState(false);
  const [initialPosition] = useState<CSSProperties>(() => {
    const cursorPosition = props.position?.x || 0;
    const editorPosition = props.editorPosition?.x || 0;
    const totalWidth = window.document.body.offsetWidth;
  
    const style: CSSProperties = {
      maxWidth: suggestionWidth,
      minWidth: suggestionWidth,
    };
  
    if ((cursorPosition + suggestionWidth) < (totalWidth - suggestionMargin)) {
      style.left = cursorPosition - editorPosition;
    } else {
      style.right = -suggestionMargin;
    }
    return style;
  });

  const select = (item: T) => {
    item && props.onSelected(item);
  }

  return (
    <div
      className={
        classNames(
          ['menu-list', 'as_frame', 'inline', 'top'],
          {
            'fade_in': isFocused && props.list?.length,
          },
        )
      }
      style={initialPosition}
    >
      {props.list?.map((item, index) => {
        return (
          <div
            key={index}
            className={
              classNames('menu', {
                'is_selected': !props.disableNavigationKey && item.autocomplete_id === props.selectedIndex
              })
            }
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