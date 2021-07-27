import React, { useState, CSSProperties, useEffect } from "react";
import classNames from "classnames";

import "./SuggestionList.scss";

type Props<T> = {
  id: string;
  list: Array<T & {autocomplete_id?: number}> | undefined;
  search: string;
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
const DEFAULT_SUGGESTION_PADDING = 5;

export const SuggestionList = <T, >(props: Props<T>): JSX.Element => {
  const suggestionWidth = props.suggestionWitdh || DEFAULT_SUGGESTION_WIDTH;
  const suggestionMargin = props.suggestionMargin || DEFAULT_SUGGESTION_MARGIN;
  const [isFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [x, setX] = useState(0);
  const [id, setId] = useState("");
  const [cssPosition, setCssPosition] = useState<CSSProperties>(() => ({
    maxWidth: suggestionWidth,
    minWidth: suggestionWidth,
    top: (props.position?.y || 0) - DEFAULT_SUGGESTION_PADDING,
    position: "fixed",
  }));

  // update the position when ID changes
  useEffect(() => {
    setPosition({
      x: props.position?.x || 0,
      y: props.position?.y || 0,
    });

  }, [props.position, props.id]);

  // keep the first X value until Y changes so the suggestion does not move left/right when typing
  useEffect(() => {
    if (props.id !== id) {
      // this is a new search, we can update the X
      setX(props.position?.x || 0);
      setId(props.id);
    }
  }, [props.position, position, props.id, id]);

  useEffect(() => {
    console.debug("Text which has been used for search:", `"${props.search}"`);
  }, [props.search]);

  useEffect(() => {
    const totalWidth = window.document.body.offsetWidth;
    if ((x + suggestionWidth) < (totalWidth - suggestionMargin)) {
      // keep the position just over the cursor
      setCssPosition(cssPosition => {
        const style = {...cssPosition, ...{ left: x, top: (props.position?.y || 0) - DEFAULT_SUGGESTION_PADDING }};
        delete style.right;
        return style;
      });
    } else if ((x - suggestionWidth) > 0) {
      // align the end of the suggestion over the cursor
      setCssPosition(cssPosition => {
        const style = {...cssPosition, ...{ right: (totalWidth - x), top: (props.position?.y || 0) - DEFAULT_SUGGESTION_PADDING }};
        delete style.left;
        return style;
      });
    } else {
      // nothing can be aligned correctly, center in the screen
      setCssPosition(cssPosition => {
        const padding = (totalWidth - suggestionWidth) / 2;
        const style = {
          ...cssPosition,
          ...{ right: padding, left: padding, top: (props.position?.y || 0) - DEFAULT_SUGGESTION_PADDING }
        };
        return style;
      });
    }

  }, [props.position?.y, x, suggestionMargin, suggestionWidth]);

  const select = (item: T) => {
    item && props.onSelected(item);
  };

  return (
    <div className='suggestions' style={cssPosition}>
      <div
        className={
          classNames(
            ['menu-list', 'as_frame', 'inline', 'top'],
            {
              'fade_in': isFocused && props.list?.length,
            },
          )
        }
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
    </div>
  );
};
