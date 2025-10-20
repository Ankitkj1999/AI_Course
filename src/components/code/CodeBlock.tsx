import { CodeBlockHeader } from './CodeBlockHeader';
import { CodeBlockContent, type BundledLanguage } from './CodeBlockContent';

interface CodeBlockProps {
  code: string;
  language: BundledLanguage;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="not-prose my-6 max-w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <CodeBlockHeader language={language} code={code} />
      <CodeBlockContent language={language}>{code}</CodeBlockContent>
    </div>
  );
}
