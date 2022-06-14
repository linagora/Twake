import _ from "lodash";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputComponent?: React.ReactNode;
  inputClassName?: string;
  className?: string;
}

export const defaultInputClassName =
  "shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-200 rounded-lg";

export default function InputLabel(props: InputProps) {
  return (
    <>
      {props.label && (
        <div className={props.className}>
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
          </label>
          <div className="mt-1">
            {props.inputComponent || (
              <input
                type="text"
                className={defaultInputClassName + " " + props.inputClassName}
                {..._.omit(props, "label", "inputClassName", "className")}
              />
            )}
          </div>
        </div>
      )}
      {!props.label &&
        (props.inputComponent || (
          <input
            type="text"
            className={
              defaultInputClassName +
              " " +
              props.inputClassName +
              " " +
              props.className
            }
            {..._.omit(props, "label", "inputClassName", "className")}
          />
        ))}
    </>
  );
}
