/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {ColorPicker} from '@/components/ColorPicker';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {
  $getSelectionStyleValueForProperty,
} from '@lexical/selection';
import {$isQuoteNode, QuoteNode} from '@lexical/rich-text';
import {$isListNode, $isListItemNode, ListNode, ListItemNode} from '@lexical/list';
import {$isTableNode, $isTableCellNode, $isTableRowNode, TableNode, TableCellNode, TableRowNode} from '@lexical/table';
import {$isCodeNode, CodeNode} from '@lexical/code';
import {useCallback, useEffect, useRef, useState} from 'react';

function Divider() {
  return <div className="divider" />;
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
  const [isQuote, setIsQuote] = useState(false);
  const [isBulletedList, setIsBulletedList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [isInTable, setIsInTable] = useState(false);
  const [isInCodeBlock, setIsInCodeBlock] = useState(false);
  const [currentHighlightColor, setCurrentHighlightColor] = useState('');
  const [currentTextColor, setCurrentTextColor] = useState('');
  const [currentFontSize, setCurrentFontSize] = useState('15px');

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      
      // Check if selection is in a quote
      const anchorNode = selection.anchor.getNode();
      const focusNode = selection.focus.getNode();
      
      // Find the nearest quote node
      let currentNode = anchorNode;
      let inQuote = false;
      while (currentNode) {
        if ($isQuoteNode(currentNode)) {
          inQuote = true;
          break;
        }
        currentNode = currentNode.getParent();
      }
      
      if (!inQuote) {
        currentNode = focusNode;
        while (currentNode) {
          if ($isQuoteNode(currentNode)) {
            inQuote = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
      }
      setIsQuote(inQuote);
      
      // Check if selection is in a list
      currentNode = anchorNode;
      let inBulletedList = false;
      let inNumberedList = false;
      
      while (currentNode) {
        if ($isListNode(currentNode)) {
          const listType = (currentNode as ListNode).__type;
          if (listType === 'bullet') {
            inBulletedList = true;
          } else if (listType === 'number') {
            inNumberedList = true;
          }
          break;
        }
        currentNode = currentNode.getParent();
      }
      
      if (!inBulletedList && !inNumberedList) {
        currentNode = focusNode;
        while (currentNode) {
          if ($isListNode(currentNode)) {
            const listType = (currentNode as ListNode).__type;
            if (listType === 'bullet') {
              inBulletedList = true;
            } else if (listType === 'number') {
              inNumberedList = true;
            }
            break;
          }
          currentNode = currentNode.getParent();
        }
      }
      
      setIsBulletedList(inBulletedList);
      setIsNumberedList(inNumberedList);
      
      // Check if selection is in a table
      currentNode = anchorNode;
      let inTable = false;
      
      while (currentNode) {
        if ($isTableNode(currentNode)) {
          inTable = true;
          break;
        }
        currentNode = currentNode.getParent();
      }
      
      if (!inTable) {
        currentNode = focusNode;
        while (currentNode) {
          if ($isTableNode(currentNode)) {
            inTable = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
      }
      
      setIsInTable(inTable);
      
      // Check if selection is in a code block
      currentNode = anchorNode;
      let inCodeBlock = false;
      
      while (currentNode) {
        if ($isCodeNode(currentNode)) {
          inCodeBlock = true;
          break;
        }
        currentNode = currentNode.getParent();
      }
      
      if (!inCodeBlock) {
        currentNode = focusNode;
        while (currentNode) {
          if ($isCodeNode(currentNode)) {
            inCodeBlock = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
      }
      
      setIsInCodeBlock(inCodeBlock);
      
      // Get current font size
      const fontSize = $getSelectionStyleValueForProperty(selection, 'font-size', '15px');
      setCurrentFontSize(fontSize);
    }
  }, []);

  const toggleQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        
        // Find if we're in a quote
        let currentNode = anchorNode;
        let isInQuote = false;
        
        while (currentNode) {
          if ($isQuoteNode(currentNode)) {
            isInQuote = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        const topLevelElement = anchorNode.getTopLevelElement();
        if (topLevelElement) {
          if (isInQuote) {
            // Convert quote back to paragraph using proper Lexical pattern
            if ($isQuoteNode(topLevelElement)) {
              const children = topLevelElement.getChildren();
              const paragraph = new ParagraphNode();
              
              children.forEach(child => {
                paragraph.append(child);
              });
              
              // Insert paragraph before removing quote to preserve selection
              topLevelElement.insertBefore(paragraph);
              topLevelElement.remove();
            }
          } else {
            // Convert paragraph to quote using proper Lexical pattern
            if (topLevelElement.getType() === 'paragraph') {
              const children = topLevelElement.getChildren();
              const quoteNode = new QuoteNode();
              
              children.forEach(child => {
                quoteNode.append(child);
              });
              
              // Insert quote before removing paragraph to preserve selection
              topLevelElement.insertBefore(quoteNode);
              topLevelElement.remove();
            }
          }
        }
      }
    });
  }, [editor]);

  const toggleBulletedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        
        // Find if we're in a list
        let currentNode = anchorNode;
        let inList = false;
        
        while (currentNode) {
          if ($isListNode(currentNode)) {
            inList = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        if (inList) {
          // Remove list by converting to paragraph
          currentNode = anchorNode;
          while (currentNode && !$isListNode(currentNode)) {
            currentNode = currentNode.getParent();
          }
          
          if (currentNode && $isListNode(currentNode)) {
            const listItem = currentNode.getFirstChild();
            if ($isListItemNode(listItem)) {
              const children = listItem.getChildren();
              const paragraph = new ParagraphNode();
              
              children.forEach(child => {
                paragraph.append(child);
              });
              
              // Insert paragraph before removing list to preserve selection
              currentNode.insertBefore(paragraph);
              currentNode.remove();
            }
          }
        } else {
          // Add bulleted list
          const topLevelElement = anchorNode.getTopLevelElement();
          if (topLevelElement && topLevelElement.getType() === 'paragraph') {
            const children = topLevelElement.getChildren();
            const listNode = new ListNode('bullet');
            const listItemNode = new ListItemNode();
            
            children.forEach(child => {
              listItemNode.append(child);
            });
            
            listNode.append(listItemNode);
            topLevelElement.replace(listNode);
          }
        }
      }
    });
  }, [editor]);

  const toggleNumberedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        
        // Find if we're in a list
        let currentNode = anchorNode;
        let inList = false;
        
        while (currentNode) {
          if ($isListNode(currentNode)) {
            inList = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        if (inList) {
          // Remove list by converting to paragraph
          currentNode = anchorNode;
          while (currentNode && !$isListNode(currentNode)) {
            currentNode = currentNode.getParent();
          }
          
          if (currentNode && $isListNode(currentNode)) {
            const listItem = currentNode.getFirstChild();
            if ($isListItemNode(listItem)) {
              const children = listItem.getChildren();
              const paragraph = new ParagraphNode();
              
              children.forEach(child => {
                paragraph.append(child);
              });
              
              // Insert paragraph before removing list to preserve selection
              currentNode.insertBefore(paragraph);
              currentNode.remove();
            }
          }
        } else {
          // Add numbered list
          const topLevelElement = anchorNode.getTopLevelElement();
          if (topLevelElement && topLevelElement.getType() === 'paragraph') {
            const children = topLevelElement.getChildren();
            const listNode = new ListNode('number');
            const listItemNode = new ListItemNode();
            
            children.forEach(child => {
              listItemNode.append(child);
            });
            
            listNode.append(listItemNode);
            topLevelElement.replace(listNode);
          }
        }
      }
    });
  }, [editor]);

  const insertTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const topLevelElement = anchorNode.getTopLevelElement();
        
        if (topLevelElement) {
          // Create a 3x3 table
          const tableNode = new TableNode();
          
          // Create 3 rows
          for (let i = 0; i < 3; i++) {
            const rowNode = new TableRowNode();
            
            // Create 3 cells per row
            for (let j = 0; j < 3; j++) {
              const cellNode = new TableCellNode(0); // 0 = body cell
              const paragraphNode = new ParagraphNode();
              const textNode = new TextNode('');
              paragraphNode.append(textNode);
              cellNode.append(paragraphNode);
              rowNode.append(cellNode);
            }
            
            tableNode.append(rowNode);
          }
          
          topLevelElement.replace(tableNode);
        }
      }
    });
  }, [editor]);

  const toggleCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        
        // Find if we're in a code block
        let currentNode = anchorNode;
        let inCodeBlock = false;
        
        while (currentNode) {
          if ($isCodeNode(currentNode)) {
            inCodeBlock = true;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        if (inCodeBlock) {
          // Remove code block by converting to paragraph
          currentNode = anchorNode;
          while (currentNode && !$isCodeNode(currentNode)) {
            currentNode = currentNode.getParent();
          }
          
          if (currentNode && $isCodeNode(currentNode)) {
            const children = currentNode.getChildren();
            const paragraph = new ParagraphNode();
            
            children.forEach(child => {
              paragraph.append(child);
            });
            
            // Insert paragraph before removing code block to preserve selection
            currentNode.insertBefore(paragraph);
            currentNode.remove();
          }
        } else {
          // Add code block
          const topLevelElement = anchorNode.getTopLevelElement();
          if (topLevelElement && topLevelElement.getType() === 'paragraph') {
            const children = topLevelElement.getChildren();
            const codeNode = new CodeNode();
            
            children.forEach(child => {
              codeNode.append(child);
            });
            
            topLevelElement.replace(codeNode);
          }
        }
      }
    });
  }, [editor]);

  const handleHighlightColor = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Get the current style and modify background color
        const nodes = selection.getNodes();
        
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const textNode = node as TextNode;
            const currentStyle = textNode.getStyle();
            let newStyle = currentStyle;
            
            // Remove existing background-color
            newStyle = newStyle.replace(/background-color:[^;]+;?/g, '');
            
            // Add new background color if provided
            if (color) {
              newStyle += `background-color: ${color};`;
            }
            
            // Remove trailing semicolon if it exists
            newStyle = newStyle.replace(/;$/, '');
            
            textNode.setStyle(newStyle);
          }
        });
      }
    });
    setCurrentHighlightColor(color);
  }, [editor]);

  const handleTextColor = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Get the current style and modify color
        const nodes = selection.getNodes();
        
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const textNode = node as TextNode;
            const currentStyle = textNode.getStyle();
            let newStyle = currentStyle;
            
            // Remove existing color
            newStyle = newStyle.replace(/color:[^;]+;?/g, '');
            
            // Add new color if provided
            if (color) {
              newStyle += `color: ${color};`;
            }
            
            // Remove trailing semicolon if it exists
            newStyle = newStyle.replace(/;$/, '');
            
            textNode.setStyle(newStyle);
          }
        });
      }
    });
    setCurrentTextColor(color);
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          {editor},
        );
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
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

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced"
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
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
        aria-label="Format Bold">
        <i className="format bold" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
        aria-label="Format Italics">
        <i className="format italic" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
        aria-label="Format Underline">
        <i className="format underline" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={'toolbar-item spaced ' + (isStrikethrough ? 'active' : '')}
        aria-label="Format Strikethrough">
        <i className="format strikethrough" />
      </button>
      <button
        onClick={toggleQuote}
        className={'toolbar-item spaced ' + (isQuote ? 'active' : '')}
        aria-label="Format Quote">
        <i className="format quote" />
      </button>
      <button
        onClick={toggleBulletedList}
        className={'toolbar-item spaced ' + (isBulletedList ? 'active' : '')}
        aria-label="Bulleted List">
        <i className="format list-bulleted" />
      </button>
      <button
        onClick={toggleNumberedList}
        className={'toolbar-item spaced ' + (isNumberedList ? 'active' : '')}
        aria-label="Numbered List">
        <i className="format list-numbered" />
      </button>
      <button
        onClick={insertTable}
        className={'toolbar-item spaced ' + (isInTable ? 'active' : '')}
        aria-label="Insert Table">
        <i className="format table" />
      </button>
      <button
        onClick={toggleCodeBlock}
        className={'toolbar-item spaced ' + (isInCodeBlock ? 'active' : '')}
        aria-label="Code Block">
        <i className="format code-block" />
      </button>
      <Divider />
      {/* Font Size Control - TODO: Add inline implementation */}
      <div className="font-size-controls">
        <button
          type="button"
          disabled={false}
          onClick={() => {
            // TODO: Implement decrease font size
          }}
          className="toolbar-item font-decrement"
          aria-label="Decrease font size"
          title="Decrease font size">
          <i className="format minus-icon" />
        </button>
        <input
          type="number"
          title="Font size"
          value="15"
          disabled={false}
          className="toolbar-item font-size-input"
          min={8}
          max={72}
          onChange={() => {}}
          onBlur={() => {}}
        />
        <button
          type="button"
          disabled={false}
          onClick={() => {
            // TODO: Implement increase font size
          }}
          className="toolbar-item font-increment"
          aria-label="Increase font size"
          title="Increase font size">
          <i className="format add-icon" />
        </button>
      </div>
      <ColorPicker
        type="highlight"
        onColorSelect={handleHighlightColor}
        currentColor={currentHighlightColor}
      />
      <ColorPicker
        type="text"
        onColorSelect={handleTextColor}
        currentColor={currentTextColor}
      />
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="toolbar-item spaced"
        aria-label="Left Align">
        <i className="format left-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className="toolbar-item spaced"
        aria-label="Center Align">
        <i className="format center-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className="toolbar-item spaced"
        aria-label="Right Align">
        <i className="format right-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="toolbar-item"
        aria-label="Justify Align">
        <i className="format justify-align" />
      </button>{' '}
    </div>
  );
}