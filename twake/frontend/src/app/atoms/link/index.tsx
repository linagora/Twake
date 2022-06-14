import _ from "lodash";
import { Link } from "react-router-dom";

export default function A(
  props: any & {
    to?: string;
    href?: string;
    children: React.ReactNode;
    noColor?: boolean;
  }
) {
  const colors = props.noColor
    ? ""
    : "hover:text-blue-700 active:text-blue-800 text-blue-600";

  if (props.to) {
    return (
      <Link
        to={props.to}
        className={colors + " " + (props.className || "")}
        {..._.omit(props, "children", "className", "noColor")}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <a
      href={props.href || "#"}
      className={colors + " " + (props.className || "")}
      {..._.omit(props, "children", "className", "noColor")}
    >
      {props.children}
    </a>
  );
}
