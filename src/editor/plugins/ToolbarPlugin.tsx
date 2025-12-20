/**
 * Enhanced Toolbar Plugin
 * Provides comprehensive formatting controls for all editor features
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { 
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import {
  INSERT_TABLE_COMMAND,
} from '@lexical/table';
import {
  $createCodeNode,
  $isCodeNode,
} from '@lexical/code';
import {
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

function Divider() {
  return <div className="divider" />;
}

function DropDown({
  disabled = false,
  buttonClassName,
  buttonIconClassName,
  buttonLabel,
  buttonAriaLabel,
  children,
  stopCloseOnClickSelf,
}: {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIconClassName?: string;
  buttonLabel?: string;
  children: JSX.Element;
  stopCloseOnClickSelf?: boolean;
}) {
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);

  const handleClose = () => {
    setShowDropDown(false);
    if (buttonRef && buttonRef.current) {
      buttonRef.current.focus();
    }
  };

  useEffect(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;

    if (showDropDown && button !== null && dropDown !== null) {
      const { top, left } = button.getBoundingClientRect();
      dropDown.style.top = `${top + 40}px`;
      dropDown.style.left = `${Math.min(
        left,
        window.innerWidth - dropDown.offsetWidth - 20,
      )}px`;
    }
  }, [dropDownRef, buttonRef, showDropDown]);

  useEffect(() => {
    const button = buttonRef.current;

    if (button !== null && showDropDown) {
      const handle = (event: MouseEvent) => {
        const target = event.target;
        if (!button.contains(target as Node)) {
          setShowDropDown(false);
        }
      };
      document.addEventListener('click', handle);

      return () => {
        document.removeEventListener('click', handle);
      };
    }
  }, [dropDownRef, buttonRef, showDropDown]);

  return (
    <div className="dropdown" ref={dropDownRef}>
      <button
        disabled={disabled}
        aria-label={buttonAriaLabel || buttonLabel}
        className={buttonClassName}
        onClick={() => setShowDropDown(!showDropDown)}
        ref={buttonRef}>
        {buttonIconClassName && <span className={buttonIconClassName} />}
        {buttonLabel && (
          <span className="text dropdown-button-text">{buttonLabel}</span>
        )}
        <i className="chevron-down" />
      </button>

      {showDropDown &&
        React.cloneElement(children, {
          onClick: () => {
            setShowDropDown(false);
          },
        })}
    </div>
  );
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [elementFormat, setElementFormat] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element;
          const type = parentList.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }

      // Update element format
      if ('getFormatType' in element && typeof element.getFormatType === 'function') {
        const formatType = element.getFormatType();
        if (formatType === 'start') {
          setElementFormat('left');
        } else if (formatType === 'end') {
          setElementFormat('right');
        } else if (formatType === 'left' || formatType === 'center' || formatType === 'right' || formatType === 'justify') {
          setElementFormat(formatType);
        } else {
          setElementFormat('left');
        }
      } else {
        setElementFormat('left');
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateToolbar]);

  const formatHeading = useCallback(
    (headingSize: HeadingTagType) => {
      if (blockType !== headingSize) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getTopLevelElementOrThrow();
            element.replace($createHeadingNode(headingSize));
          }
        });
      }
    },
    [blockType, editor],
  );

  const formatQuote = useCallback(() => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getTopLevelElementOrThrow();
          element.replace($createQuoteNode());
        }
      });
    }
  }, [blockType, editor]);

  const formatCode = useCallback(() => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getTopLevelElementOrThrow();
          if ($isCodeNode(element)) {
            return;
          }
          element.replace($createCodeNode());
        }
      });
    }
  }, [blockType, editor]);

  const insertLink = useCallback(() => {
    if (!isCode) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isCode]);

  const insertImage = useCallback(() => {
    const src = prompt('Enter image URL:');
    if (src) {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: 'Image',
        src,
      });
    }
  }, [editor]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      {/* History Group */}
      <div className="toolbar-group">
        <button
          disabled={!canUndo}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          className="toolbar-item"
          aria-label="Undo">
          <i className="format undo" />
        </button>
        <button
          disabled={!canRedo}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          className="toolbar-item"
          aria-label="Redo">
          <i className="format redo" />
        </button>
      </div>
      
      <Divider />
      
      {/* Block Type Group */}
      <div className="toolbar-group">
        <DropDown
          disabled={false}
          buttonClassName="toolbar-item block-controls"
          buttonIconClassName=""
          buttonLabel={
            blockType === 'paragraph' ? 'Normal' :
            blockType === 'h1' ? 'H1' :
            blockType === 'h2' ? 'H2' :
            blockType === 'h3' ? 'H3' :
            blockType === 'h4' ? 'H4' :
            blockType === 'h5' ? 'H5' :
            blockType === 'h6' ? 'H6' :
            blockType === 'quote' ? 'Quote' :
            blockType === 'code' ? 'Code' :
            blockType === 'bullet' ? 'Bullet' :
            blockType === 'number' ? 'Number' :
            blockType === 'check' ? 'Check' :
            'Normal'
          }
          buttonAriaLabel="Formatting options for text style">
          <div className="dropdown-menu">
            <button
              className="item"
              onClick={() => {
                // Convert to paragraph - handled by default behavior
              }}>
              <i className="icon paragraph" />
              <span className="text">Normal</span>
            </button>
            <button
              className="item"
              onClick={() => formatHeading('h1')}>
              <i className="icon h1" />
              <span className="text">Heading 1</span>
            </button>
            <button
              className="item"
              onClick={() => formatHeading('h2')}>
              <i className="icon h2" />
              <span className="text">Heading 2</span>
            </button>
            <button
              className="item"
              onClick={() => formatHeading('h3')}>
              <i className="icon h3" />
              <span className="text">Heading 3</span>
            </button>
            <button
              className="item"
              onClick={() => formatQuote()}>
              <i className="icon quote" />
              <span className="text">Quote</span>
            </button>
            <button
              className="item"
              onClick={() => formatCode()}>
              <i className="icon code" />
              <span className="text">Code Block</span>
            </button>
          </div>
        </DropDown>
      </div>
      
      <Divider />
      
      {/* Text Formatting Group */}
      <div className="toolbar-group">
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={'toolbar-item ' + (isBold ? 'active' : '')}
          aria-label="Format Bold">
          <i className="format bold" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={'toolbar-item ' + (isItalic ? 'active' : '')}
          aria-label="Format Italics">
          <i className="format italic" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={'toolbar-item ' + (isUnderline ? 'active' : '')}
          aria-label="Format Underline">
          <i className="format underline" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
          className={'toolbar-item ' + (isStrikethrough ? 'active' : '')}
          aria-label="Format Strikethrough">
          <i className="format strikethrough" />
        </button>
      </div>
      
      <Divider />
      
      {/* Advanced Text Formatting Group */}
      <div className="toolbar-group advanced-formatting">
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
          }}
          className={'toolbar-item ' + (isSubscript ? 'active' : '')}
          aria-label="Format Subscript">
          <i className="format subscript" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
          }}
          className={'toolbar-item ' + (isSuperscript ? 'active' : '')}
          aria-label="Format Superscript">
          <i className="format superscript" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          }}
          className={'toolbar-item ' + (isCode ? 'active' : '')}
          aria-label="Inline Code">
          <i className="format code" />
        </button>
      </div>
      
      <Divider />
      
      {/* Lists Group */}
      <div className="toolbar-group">
        <button
          onClick={() => {
            if (blockType !== 'bullet') {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
          className={'toolbar-item ' + (blockType === 'bullet' ? 'active' : '')}
          aria-label="Bulleted List">
          <i className="format list-ul" />
        </button>
        <button
          onClick={() => {
            if (blockType !== 'number') {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
          className={'toolbar-item ' + (blockType === 'number' ? 'active' : '')}
          aria-label="Numbered List">
          <i className="format list-ol" />
        </button>
        <button
          onClick={() => {
            if (blockType !== 'check') {
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
          className={'toolbar-item ' + (blockType === 'check' ? 'active' : '')}
          aria-label="Check List">
          <i className="format check" />
        </button>
      </div>
      
      <Divider />
      
      {/* Alignment Group */}
      <div className="toolbar-group alignment-group">
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          }}
          className={'toolbar-item ' + (elementFormat === 'left' ? 'active' : '')}
          aria-label="Left Align">
          <i className="format left-align" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          }}
          className={'toolbar-item ' + (elementFormat === 'center' ? 'active' : '')}
          aria-label="Center Align">
          <i className="format center-align" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          }}
          className={'toolbar-item ' + (elementFormat === 'right' ? 'active' : '')}
          aria-label="Right Align">
          <i className="format right-align" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          }}
          className={'toolbar-item ' + (elementFormat === 'justify' ? 'active' : '')}
          aria-label="Justify Align">
          <i className="format justify-align" />
        </button>
      </div>
      
      <Divider />
      
      {/* Insert Elements Group */}
      <div className="toolbar-group">
        <button
          onClick={insertLink}
          className="toolbar-item"
          aria-label="Insert Link">
          <i className="format link" />
        </button>
        <button
          onClick={insertImage}
          className="toolbar-item"
          aria-label="Insert Image">
          <i className="format image" />
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
          }}
          className="toolbar-item"
          aria-label="Insert Table">
          <i className="format table" />
        </button>
      </div>
    </div>
  );
}