/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $isTextNode,
  DOMConversionMap,
  DOMExportOutput,
  DOMExportOutputMap,
  isHTMLElement,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  TextNode,
} from 'lexical';

import ExampleTheme from './ExampleTheme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import { parseAllowedColor, parseAllowedFontSize } from './styleConfig';

// Import code highlighting utilities
// import { registerCodeHighlighting } from '@lexical/code';
// import { createLowlight } from 'lowlight';

// Import node types
import {
  HeadingNode,
  QuoteNode,
  CodeNode,
  LinkNode,
  ImageNode,
} from './nodes';

// Import code highlight node
import { CodeHighlightNode } from '@lexical/code';

// Import list node types
import { ListNode, ListItemNode } from '@lexical/list';

// Import table node types
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

const placeholder = 'Enter some rich text...';

const removeStylesExportDOM = (
  editor: LexicalEditor,
  target: LexicalNode,
): DOMExportOutput => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    // Remove all inline styles and classes if the element is an HTMLElement
    // Children are checked as well since TextNode can be nested
    // in i, b, and strong tags.
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class]'),
    ]) {
      el.removeAttribute('class');
      el.removeAttribute('style');
    }
  }
  return output;
};

const exportMap: DOMExportOutputMap = new Map<
  Klass<LexicalNode>,
  (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput
>([
  [ParagraphNode, removeStylesExportDOM],
  [TextNode, removeStylesExportDOM],
]);

const getExtraStyles = (element: HTMLElement): string => {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
};

const constructImportMap = (): DOMConversionMap => {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
};

const editorConfig = {
  html: {
    export: exportMap,
    import: constructImportMap(),
  },
  namespace: 'React.js Demo',
  nodes: [
    ParagraphNode,
    TextNode,
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    ImageNode,
    ListNode,
    ListItemNode,
    TableNode,
    TableCellNode,
    TableRowNode,
  ],
  onError(error: Error) {
    throw error;
  },
  theme: ExampleTheme,
};

function Editor() {
  const initialConfig = {
    ...editorConfig,
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder">{placeholder}</div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <TablePlugin />
          <AutoFocusPlugin />
          <TreeViewPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}

// Component to set up code highlighting (disabled for now)
// function EditorSetup() {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Register code highlighting
//     const lowlightInstance = createLowlight();
//     registerCodeHighlighting(editor, lowlightInstance);
//   }, [editor]);

//   return null;
// }

export { Editor };
export default Editor;
