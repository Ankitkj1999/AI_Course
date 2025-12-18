import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

type ImagePayload = {
  src: string;
  altText?: string;
  width?: 'inherit' | number;
  height?: 'inherit' | number;
  key?: NodeKey;
};

export type SerializedImageNode = Spread<
  {
    type: 'image';
    version: 1;
    src: string;
    altText: string;
    width: 'inherit' | number;
    height: 'inherit' | number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        src: node.__src,
        altText: node.__altText,
        width: node.__width,
        height: node.__height,
      },
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return new ImageNode({ src, altText, width, height });
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    };
  }

  constructor(payload: ImagePayload, key?: NodeKey) {
    super(key);
    this.__src = payload.src;
    this.__altText = payload.altText || '';
    this.__width = payload.width || 'inherit';
    this.__height = payload.height || 'inherit';
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(_editor: any, _config: any): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        width={this.__width}
        height={this.__height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    );
  }
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(
    {
      src,
      altText,
      width,
      height,
    },
    key
  );
}

export function $isImageNode(node: any): node is ImageNode {
  return node instanceof ImageNode;
}