import React from 'react';
import _ from 'lodash';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: 'primary' | 'secondary' | 'danger' | 'default' | 'outline';
  size?: 'md' | 'lg' | 'sm';
  icon?: (props: any) => JSX.Element;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Button = (props: ButtonProps) => {
  const disabled = props.disabled || props.loading;

  let className = 'text-white bg-blue-500 hover:bg-blue-700 active:bg-blue-800 border-transparent ';

  if (props.theme === 'secondary')
    className =
      'text-blue-500 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 border-transparent ';

  if (props.theme === 'danger')
    className = 'text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-transparent ';

  if (props.theme === 'default')
    className =
      'text-black dark:text-white bg-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-900 hover:bg-gray-50 active:bg-gray-200 border-gray-300';

  if (props.theme === 'outline')
    className =
      'text-blue-500 bg-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-900 hover:bg-gray-50 active:bg-gray-200 border-blue-500';

  if (disabled) className += ' opacity-50 pointer-events-none';

  if (props.size === 'lg') className = className + ' text-lg h-11';
  else if (props.size === 'sm') className = className + ' text-sm h-7 px-3';
  else className = className + ' text-base h-9';

  if (!props.children) {
    if (props.size === 'lg') className = className + ' w-11 !p-0 justify-center';
    else if (props.size === 'sm') className = className + ' w-7 !p-0 justify-center';
    else className = className + ' w-9 !p-0 justify-center';
  }

  return (
    <button
      type="button"
      className={
        ' inline-flex items-center px-4 py-2 border font-medium rounded-md focus:outline-none ' +
        className +
        ' ' +
        props.className
      }
      disabled={disabled}
      {..._.omit(props, 'loading', 'children', 'className')}
    >
      {props.loading && (
        <>
          <svg
            className={'animate-spin w-4 h-4 ' + (props.children ? 'mr-2 -ml-1' : '-mx-1')}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>{' '}
        </>
      )}
      {props.icon && !(props.loading && !props.children) && (
        <props.icon className={'w-4 h-4 ' + (props.children ? 'mr-1 -ml-1' : '-mx-1')} />
      )}
      {props.children}
    </button>
  );
};
