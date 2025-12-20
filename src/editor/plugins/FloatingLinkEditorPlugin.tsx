/**
 * Floating Link Editor Plugin
 * Provides a floating toolbar for editing links
 */

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return focus.isBefore(anchor) ? anchorNode : focusNode;
  } else {
    return focus.isBefore(anchor) ? focusNode : anchorNode;
  }
}

function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith('http') && !parsedUrl.protocol.startsWith('mailto')) {
      return 'https://' + url;
    }
  } catch {
    return url.startsWith('http') ? url : 'https://' + url;
  }
  return url;
}

function setFloatingElemPosition(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
): void {
  const scrollerElem = anchorElem.parentElement;

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();

  let top = targetRect.top - floatingElemRect.height - 10;
  let left = targetRect.left - anchorElementRect.left;

  if (top < editorScrollerRect.top) {
    top = targetRect.bottom + 10;
  }

  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - 20;
  }

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

export default function FloatingLinkEditorPlugin({
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode,
}: {
  anchorElem: HTMLElement;
  isLinkEditMode: boolean;
  setIsLinkEditMode: (value: boolean) => void;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [editedLinkUrl, setEditedLinkUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = $findMatchingParent(node, $isLinkNode);

      if (linkParent) {
        setLinkUrl(linkParent.getURL());
        setIsLink(true);
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
        setIsLink(true);
      } else {
        setLinkUrl('');
        setIsLink(false);
      }
    }

    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const rootElement = editor.getRootElement();

    if (editorElem === null || rootElement === null) {
      return;
    }

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRect = nativeSelection.getRangeAt(0).getBoundingClientRect();
      if (domRect) {
        setFloatingElemPosition(domRect, editorElem, anchorElem);
      }
    } else {
      setFloatingElemPosition(null, editorElem, anchorElem);
    }
  }, [anchorElem, editor]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    };

    window.addEventListener('resize', update);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [anchorElem.parentElement, editor, updateLinkEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false);
            setIsEditMode(false);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateLinkEditor, isLink]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditMode]);

  const handleLinkSubmission = () => {
    if (editedLinkUrl !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl));
    }
    setIsEditMode(false);
  };

  if (!isLink) {
    return null;
  }

  return createPortal(
    <div
      ref={editorRef}
      className="link-editor"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        opacity: 0,
      }}
    >
      {isEditMode ? (
        <div style={{ display: 'flex', gap: '8px', padding: '8px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <input
            ref={inputRef}
            type="text"
            value={editedLinkUrl}
            onChange={(e) => setEditedLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleLinkSubmission();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsEditMode(false);
              }
            }}
            style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '3px', minWidth: '300px' }}
          />
          <button
            onClick={handleLinkSubmission}
            style={{ padding: '4px 12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
          >
            Save
          </button>
          <button
            onClick={() => setIsEditMode(false)}
            style={{ padding: '4px 12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '3px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', padding: '8px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', alignItems: 'center' }}>
          <a
            href={sanitizeUrl(linkUrl)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1890ff', textDecoration: 'none', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {linkUrl}
          </a>
          <button
            onClick={() => {
              setEditedLinkUrl(linkUrl);
              setIsEditMode(true);
            }}
            style={{ padding: '4px 8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            }}
            style={{ padding: '4px 8px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
          >
            Remove
          </button>
        </div>
      )}
    </div>,
    anchorElem,
  );
}
