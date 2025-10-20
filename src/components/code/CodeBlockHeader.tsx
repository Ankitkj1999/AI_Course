import { CheckIcon, CopyIcon } from 'lucide-react';
import { useCopyText } from '../../hooks/use-copy-text';

interface CodeBlockHeaderProps {
  language: string;
  code: string;
}

export function CodeBlockHeader({ language, code }: CodeBlockHeaderProps) {
  const { isCopied, copyText } = useCopyText();

  return (
    <div className="flex items-center justify-between bg-gray-100 px-4 py-2 dark:bg-gray-800">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
        {language}
      </span>
      <button
        onClick={() => copyText(code)}
        className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        {isCopied ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
