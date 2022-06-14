import { CheckIcon, ClipboardCopyIcon } from "@heroicons/react/outline";
import _ from "lodash";
import { useCallback, useRef, useState } from "react";
import { Button } from "../button/button";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const defaultInputClassName =
  "shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-sm border-gray-200 rounded-lg";

let copiedTimeout: any = 0;

export default function InputCopiable(props: InputProps) {
  const [copied, setCopied] = useState(false);

  //Function to copy to clipboard props.value
  const copyToClipboard = useCallback(() => {
    setCopied(false);
    const textField = document.createElement("textarea");
    textField.innerText = props.value as string;
    document.body.appendChild(textField);
    textField.select();
    if (!navigator.clipboard) {
      document.execCommand("copy");
    } else {
      navigator.clipboard.writeText(textField.value);
    }
    textField.remove();
    setCopied(true);
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }, 500);
  }, [setCopied]);

  return (
    <div className="mt-1 flex rounded-md shadow-sm">
      <div className="relative flex items-stretch flex-grow focus-within:z-10">
        <input
          className={
            defaultInputClassName +
            " rounded-r-none border px-2 " +
            props.className
          }
          {..._.omit(props, "label", "inputClassName", "className")}
        />
      </div>
      <Button
        theme="default"
        className="-ml-px relative rounded-l-none inline-flex items-center space-x-2 px-4 py-2 border shadow-none"
        onClick={() => copyToClipboard()}
      >
        {copied && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
        {!copied && (
          <ClipboardCopyIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
