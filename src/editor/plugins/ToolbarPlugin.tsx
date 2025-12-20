/**
 * Enhanced Toolbar Plugin
 * Provides comprehensive formatting controls following Lexical playground patterns
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  ElementFormatType,
  TextFormatType,
  $addUpdateTag,
  SKIP_DOM_SELECTION_TAG,
  LexicalEditor,
  TextNode,
  $createParagraphNode,
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
  ListNode,
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
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from '@lexical/selection';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

// Block type mapping
const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
};

// Font options following playground pattern
const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

// Element format options
const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    name: 'Start Align',
  },
};

function dropDownActiveClass(active: boolean) {
  return active ? 'active dropdown-item-active' : '';
}

function Divider() {
  return <div className="divider" />;
}

// Enhanced DropDown component following playground pattern
function DropDown({
  disabled = false,
  buttonClassName,
  buttonIconClassName,
  buttonLabel,
  buttonAriaLabel,
  children,
}: {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIconClassName?: string;
  buttonLabel?: string;
  children: JSX.Element;
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

// DropDown Item component
function DropDownItem({
  children,
  className,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}) {
  return (
    <button className={className} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
}

// Block Format DropDown
function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled?: boolean;
}) {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getTopLevelElementOrThrow();
        if ($isHeadingNode(element) || $isCodeNode(element)) {
          element.replace($createParagraphNode());
        }
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
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
  };

  const formatQuote = () => {
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
  };

  const formatCode = () => {
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
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatCheckList = () => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonAriaLabel="Formatting options for text style">
      <div className="dropdown-menu">
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'paragraph')}
          onClick={formatParagraph}>
          <div className="icon-text-container">
            <i className="icon paragraph" />
            <span className="text">Normal</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'h1')}
          onClick={() => formatHeading('h1')}>
          <div className="icon-text-container">
            <i className="icon h1" />
            <span className="text">Heading 1</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'h2')}
          onClick={() => formatHeading('h2')}>
          <div className="icon-text-container">
            <i className="icon h2" />
            <span className="text">Heading 2</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'h3')}
          onClick={() => formatHeading('h3')}>
          <div className="icon-text-container">
            <i className="icon h3" />
            <span className="text">Heading 3</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'number')}
          onClick={formatNumberedList}>
          <div className="icon-text-container">
            <i className="icon numbered-list" />
            <span className="text">Numbered List</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'bullet')}
          onClick={formatBulletList}>
          <div className="icon-text-container">
            <i className="icon bullet-list" />
            <span className="text">Bullet List</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'check')}
          onClick={formatCheckList}>
          <div className="icon-text-container">
            <i className="icon check-list" />
            <span className="text">Check List</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'quote')}
          onClick={formatQuote}>
          <div className="icon-text-container">
            <i className="icon quote" />
            <span className="text">Quote</span>
          </div>
        </DropDownItem>
        <DropDownItem
          className={'item wide ' + dropDownActiveClass(blockType === 'code')}
          onClick={formatCode}>
          <div className="icon-text-container">
            <i className="icon code" />
            <span className="text">Code Block</span>
          </div>
        </DropDownItem>
      </div>
    </DropDown>
  );
}

// Font DropDown component
function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}) {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        $addUpdateTag('skip-selection-focus');
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family'
      ? 'Formatting options for font family'
      : 'Formatting options for font size';

  return (
    <DropDown
      disabled={disabled}
      buttonClassName={'toolbar-item ' + style}
      buttonLabel={value}
      buttonIconClassName={
        style === 'font-family' ? 'icon block-type font-family' : ''
      }
      buttonAriaLabel={buttonAriaLabel}>
      <div className="dropdown-menu">
        {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
          ([option, text]) => (
            <DropDownItem
              className={`item ${dropDownActiveClass(value === option)} ${
                style === 'font-size' ? 'fontsize-item' : ''
              }`}
              onClick={() => handleClick(option)}
              key={option}>
              <span className="text">{text}</span>
            </DropDownItem>
          ),
        )}
      </div>
    </DropDown>
  );
}

// Element Format DropDown
function ElementFormatDropdown({
  editor,
  value,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel={formatOption.name}
      buttonIconClassName={`icon ${formatOption.icon}`}
      buttonClassName="toolbar-item spaced alignment"
      buttonAriaLabel="Formatting options for text alignment">
      <div className="dropdown-menu">
        <DropDownItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          }}
          className="item wide">
          <div className="icon-text-container">
            <i className="icon left-align" />
            <span className="text">Left Align</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          }}
          className="item wide">
          <div className="icon-text-container">
            <i className="icon center-align" />
            <span className="text">Center Align</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          }}
          className="item wide">
          <div className="icon-text-container">
            <i className="icon right-align" />
            <span className="text">Right Align</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          }}
          className="item wide">
          <div className="icon-text-container">
            <i className="icon justify-align" />
            <span className="text">Justify Align</span>
          </div>
        </DropDownItem>
      </div>
    </DropDown>
  );
}

// Color Picker component
function DropdownColorPicker({
  disabled = false,
  buttonClassName,
  buttonAriaLabel,
  buttonIconClassName,
  color,
  onChange,
  title,
}: {
  disabled?: boolean;
  buttonClassName: string;
  buttonAriaLabel?: string;
  buttonIconClassName?: string;
  color: string;
  onChange: (color: string, skipHistoryStack: boolean, skipRefocus: boolean) => void;
  title?: string;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    onChange(newColor, false, false);
  };

  return (
    <div className="color-picker">
      <button
        className={buttonClassName}
        onClick={() => setShowColorPicker(!showColorPicker)}
        aria-label={buttonAriaLabel}
        title={title}
        disabled={disabled}>
        <span className={buttonIconClassName} style={{ backgroundColor: color }} />
      </button>
      {showColorPicker && (
        <div className="color-picker-dropdown">
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            ref={colorInputRef}
          />
        </div>
      )}
    </div>
  );
}

// Clear formatting utility
function clearFormatting(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.getNodes().forEach((node) => {
        if (node.getType() === 'text') {
          const textNode = node as TextNode;
          textNode.setFormat(0);
          textNode.setStyle('');
        }
      });
    }
  });
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  
  // Toolbar state following playground pattern
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('15px');
  const [fontColor, setFontColor] = useState('#000');
  const [bgColor, setBgColor] = useState('#fff');
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

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
      setIsHighlight(selection.hasFormat('highlight'));

      // Update style properties
      setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000'));
      setBgColor($getSelectionStyleValueForProperty(selection, 'background-color', '#fff'));
      setFontFamily($getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'));
      setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', '15px'));

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
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }

      // Update element format
      if ('getFormatType' in element && typeof element.getFormatType === 'function') {
        const formatType = element.getFormatType();
        setElementFormat(formatType || 'left');
      } else {
        setElementFormat('left');
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
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
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, $updateToolbar]);

  // Format command dispatchers
  const dispatchFormatTextCommand = (
    payload: TextFormatType,
    skipRefocus: boolean = false,
  ) => {
    editor.update(() => {
      if (skipRefocus) {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, payload);
    });
  };

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipRefocus: boolean = false) => {
      editor.update(() => {
        if (skipRefocus) {
          $addUpdateTag(SKIP_DOM_SELECTION_TAG);
        }
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText({ color: value }, skipRefocus);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText({ 'background-color': value }, skipRefocus);
    },
    [applyStyleText],
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

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
      <button
        disabled={!canUndo || !isEditable}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="toolbar-item spaced"
        aria-label="Undo">
        <i className="format undo" />
      </button>
      <button
        disabled={!canRedo || !isEditable}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="toolbar-item"
        aria-label="Redo">
        <i className="format redo" />
      </button>
      
      <Divider />
      
      {/* Block Type Group */}
      <BlockFormatDropDown
        disabled={!isEditable}
        blockType={blockType}
        editor={editor}
      />
      
      <Divider />
      
      {/* Font Controls */}
      <FontDropDown
        disabled={!isEditable}
        style="font-family"
        value={fontFamily}
        editor={editor}
      />
      <FontDropDown
        disabled={!isEditable}
        style="font-size"
        value={fontSize}
        editor={editor}
      />
      
      <Divider />
      
      {/* Text Formatting Group */}
      <button
        disabled={!isEditable}
        onClick={() => dispatchFormatTextCommand('bold')}
        className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
        aria-label="Format Bold">
        <i className="format bold" />
      </button>
      <button
        disabled={!isEditable}
        onClick={() => dispatchFormatTextCommand('italic')}
        className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
        aria-label="Format Italics">
        <i className="format italic" />
      </button>
      <button
        disabled={!isEditable}
        onClick={() => dispatchFormatTextCommand('underline')}
        className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
        aria-label="Format Underline">
        <i className="format underline" />
      </button>
      <button
        disabled={!isEditable}
        onClick={() => dispatchFormatTextCommand('code')}
        className={'toolbar-item spaced ' + (isCode ? 'active' : '')}
        aria-label="Insert code block">
        <i className="format code" />
      </button>
      <button
        disabled={!isEditable}
        onClick={insertLink}
        className={'toolbar-item spaced ' + (isLink ? 'active' : '')}
        aria-label="Insert link">
        <i className="format link" />
      </button>
      
      <Divider />
      
      {/* Color Controls */}
      <DropdownColorPicker
        disabled={!isEditable}
        buttonClassName="toolbar-item color-picker"
        buttonAriaLabel="Formatting text color"
        buttonIconClassName="icon font-color"
        color={fontColor}
        onChange={onFontColorSelect}
        title="text color"
      />
      <DropdownColorPicker
        disabled={!isEditable}
        buttonClassName="toolbar-item color-picker"
        buttonAriaLabel="Formatting background color"
        buttonIconClassName="icon bg-color"
        color={bgColor}
        onChange={onBgColorSelect}
        title="bg color"
      />
      
      <Divider />
      
      {/* Advanced Formatting Dropdown */}
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel=""
        buttonAriaLabel="Formatting options for additional text styles"
        buttonIconClassName="icon dropdown-more">
        <div className="dropdown-menu">
          <DropDownItem
            onClick={() => dispatchFormatTextCommand('strikethrough')}
            className={'item wide ' + dropDownActiveClass(isStrikethrough)}
            title="Strikethrough">
            <div className="icon-text-container">
              <i className="icon strikethrough" />
              <span className="text">Strikethrough</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() => dispatchFormatTextCommand('subscript')}
            className={'item wide ' + dropDownActiveClass(isSubscript)}
            title="Subscript">
            <div className="icon-text-container">
              <i className="icon subscript" />
              <span className="text">Subscript</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() => dispatchFormatTextCommand('superscript')}
            className={'item wide ' + dropDownActiveClass(isSuperscript)}
            title="Superscript">
            <div className="icon-text-container">
              <i className="icon superscript" />
              <span className="text">Superscript</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() => dispatchFormatTextCommand('highlight')}
            className={'item wide ' + dropDownActiveClass(isHighlight)}
            title="Highlight">
            <div className="icon-text-container">
              <i className="icon highlight" />
              <span className="text">Highlight</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() => clearFormatting(editor)}
            className="item wide"
            title="Clear text formatting">
            <div className="icon-text-container">
              <i className="icon clear" />
              <span className="text">Clear Formatting</span>
            </div>
          </DropDownItem>
        </div>
      </DropDown>
      
      <Divider />
      
      {/* Lists Group */}
      <button
        disabled={!isEditable}
        onClick={() => {
          if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
        }}
        className={'toolbar-item spaced ' + (blockType === 'bullet' ? 'active' : '')}
        aria-label="Bulleted List">
        <i className="format list-ul" />
      </button>
      <button
        disabled={!isEditable}
        onClick={() => {
          if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
        }}
        className={'toolbar-item spaced ' + (blockType === 'number' ? 'active' : '')}
        aria-label="Numbered List">
        <i className="format list-ol" />
      </button>
      <button
        disabled={!isEditable}
        onClick={() => {
          if (blockType !== 'check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
        }}
        className={'toolbar-item spaced ' + (blockType === 'check' ? 'active' : '')}
        aria-label="Check List">
        <i className="format check" />
      </button>
      
      <Divider />
      
      {/* Alignment Group */}
      <ElementFormatDropdown
        disabled={!isEditable}
        value={elementFormat}
        editor={editor}
      />
      
      <Divider />
      
      {/* Insert Elements Group */}
      <button
        disabled={!isEditable}
        onClick={insertImage}
        className="toolbar-item spaced"
        aria-label="Insert Image">
        <i className="format image" />
      </button>
      <button
        disabled={!isEditable}
        onClick={() => {
          editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
        }}
        className="toolbar-item spaced"
        aria-label="Insert Table">
        <i className="format table" />
      </button>
    </div>
  );
}