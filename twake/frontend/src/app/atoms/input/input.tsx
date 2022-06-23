import _ from 'lodash';
import { Info } from '../text';

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLInputElement>,
    'size'
  > {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  feedback?: string;
  hasError?: boolean;
  multiline?: boolean;
  inputComponent?: React.ReactNode;
  inputClassName?: string;
  className?: string;
}

export const defaultInputClassName =
  'tw-input bg-zinc-100 border-zinc-200 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white focus:border-blue-500 focus:ring-0 block w-full rounded-md';

export const errorInputClassName =
  'tw-input bg-red-100 border-red-200 dark:bg-red-900 dark:border-red-800 dark:text-white focus:border-red-700 focus:ring-0 block w-full rounded-md';

export default function InputLabel(props: InputProps) {
  return (
    <>
      {props.label && (
        <div className={props.className}>
          <label className="block text-sm text-zinc-400">{props.label}</label>
          <div className="mt-1">
            <Input {...props} />
          </div>
          {props.feedback && (
            <Info noColor className={props.hasError ? 'text-red-400' : 'text-blue-500'}>
              {props.feedback}
            </Info>
          )}
        </div>
      )}
      {!props.label && <Input {...props} />}
    </>
  );
}

export const Input = (props: InputProps) => {
  let inputClassName = props.hasError ? errorInputClassName : defaultInputClassName;
  inputClassName = inputClassName + (props.disabled ? ' opacity-75' : '');

  if (props.size === 'lg') inputClassName = inputClassName + ' h-11';
  else if (props.size === 'sm') inputClassName = inputClassName + ' h-7';
  else inputClassName = inputClassName + ' h-9';

  return (
    <>
      {props.inputComponent ||
        (props.multiline ? (
          <textarea
            className={inputClassName + ' ' + props.inputClassName}
            {..._.omit(props, 'label', 'inputClassName', 'className', 'value', 'size')}
          >
            {props.value}
          </textarea>
        ) : (
          <input
            type="text"
            className={inputClassName + ' ' + props.inputClassName}
            {..._.omit(props, 'label', 'inputClassName', 'className', 'size')}
          />
        ))}
    </>
  );
};
