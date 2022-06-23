import _ from 'lodash';

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLInputElement>,
    'size'
  > {
  theme?: 'plain' | 'outline';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  feedback?: string;
  hasError?: boolean;
  multiline?: boolean;
  inputComponent?: React.ReactNode;
  inputClassName?: string;
  className?: string;
}

const baseInputClassName =
  'tw-input block w-full rounded-md focus:ring-1 focus:ring-blue-500 z-0 focus:z-10 dark:text-white text-black ';

export const defaultInputClassName = (theme: 'plain' | 'outline' = 'plain') => {
  return (
    baseInputClassName +
    (theme === 'plain'
      ? 'bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-800'
      : 'bg-zinc-50 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700')
  );
};

export const errorInputClassName = (theme: 'plain' | 'outline' = 'plain') => {
  return baseInputClassName + 'bg-red-200 border-red-200 dark:bg-red-900 dark:border-red-800';
};

export const Input = (props: InputProps) => {
  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? ' opacity-75' : '');

  if (!props.multiline) {
    if (props.size === 'lg') inputClassName = inputClassName + ' h-11';
    else if (props.size === 'sm') inputClassName = inputClassName + ' h-7';
    else inputClassName = inputClassName + ' h-9';
  }

  return (
    <>
      {props.inputComponent ||
        (props.multiline ? (
          <textarea
            className={inputClassName + ' ' + props.inputClassName + ' ' + props.className}
            {..._.omit(props, 'label', 'inputClassName', 'className', 'value', 'size')}
          >
            {props.value}
          </textarea>
        ) : (
          <input
            type="text"
            className={inputClassName + ' ' + props.inputClassName + ' ' + props.className}
            {..._.omit(props, 'label', 'inputClassName', 'className', 'size')}
          />
        ))}
    </>
  );
};
