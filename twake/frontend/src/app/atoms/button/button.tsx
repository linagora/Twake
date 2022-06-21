import React from 'react';
import _ from 'lodash';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: 'primary' | 'secondary' | 'danger' | 'default';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button = (props: ButtonProps) => {
  const disabled = props.disabled || props.loading;

  let colors = 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border-transparent ';

  if (props.theme === 'secondary')
    colors = 'text-blue-600 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 border-transparent ';

  if (props.theme === 'danger')
    colors = 'text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-transparent ';

  if (props.theme === 'default')
    colors = 'text-black bg-white hover:bg-gray-50 active:bg-gray-200 border-gray-300';

  if (disabled) colors += ' opacity-50 pointer-events-none text-white';

  return (
    <button
      type="button"
      className={
        ' inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none ' +
        colors +
        ' ' +
        props.className
      }
      disabled={disabled}
      {..._.omit(props, 'loading', 'children', 'className')}
    >
      {props.loading && (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
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
      {props.children}
    </button>
  );
};
