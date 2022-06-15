import _ from "lodash";
import { defaultInputClassName } from "./input";

interface InputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children?: React.ReactNode;
}

export default function Select(props: InputProps) {
  return (
    <select
      className={defaultInputClassName + " " + props.className}
      {..._.omit(props, "label", "className")}
    >
      {props.children}
    </select>
  );
}
