/**
 * Page Break Node
 * Creates a visual page break in the editor
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { DecoratorNode } from 'lexical';
import * as React from 'react';

export interface PageBreakPayload {
  key?: NodeKey;
}

export type SerializedPageBreakNode = Spread<
  {
    type: 'page-break';
    version: 1;
  },
  SerializedLexicalNode
>;

function PageBreakComponent(): JSX.Element {
  return (
    <div className="page-break" style={{
      borderTop: '2px dashed #ccc',
      margin: '20px 0',
      padding: '10px 0',
      textAlign: 'center',
      color: '#666',
      fontSize: '12px',
      userSelect: 'none'
    }}>
      Page Break
    </div>
  );
}

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'page-break';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'page-break-wrapper';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-page-break')) {
          return null;
        }
        return {
          conversion: convertPageBreakElement,
          priority: 2,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      type: 'page-break',
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-page-break', 'true');
    element.style.pageBreakAfter = 'always';
    return { element };
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <PageBreakComponent />;
  }
}

function convertPageBreakElement(): DOMConversionOutput {
  return { node: $createPageBreakNode() };
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(
  node: LexicalNode | null | undefined,
): node is PageBreakNode {
  return node instanceof PageBreakNode;
}