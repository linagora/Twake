import React from 'react';

// @ts-ignore
interface TabsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tabs: JSX.Element[] | string[];
  selected: number;
  onClick: (idx: number) => void;
}

const defaultTabClassName =
  ' cursor-pointer h-12 px-4 flex items-center border-b-2 border-transparent text-zinc-500 hover:text-blue-600 transition-all';
const activeTabClassName = ' text-blue-500 border-blue-500';

export default function Tab(props: TabsProps) {
  return (
    <>
      <div className="overflow-auto flex w-100 border-b border-zinc-200 dark:border-zinc-800 transition-all select-none">
        {props.tabs.map((tab, idx) => {
          const cl = defaultTabClassName + (idx === props.selected ? activeTabClassName : '');
          return (
            <div key={idx} className={cl} onClick={() => props.onClick(idx)}>
              {tab}
            </div>
          );
        })}
      </div>
    </>
  );
}
