# @milkdown/preset-gfm

Github flavored markdown preset for [milkdown](https://milkdown.dev/).

> Notice: The GFM preset needs to be used with the [commonmark preset](https://milkdown.dev/api/preset-commonmark).

```typescript
import { Editor } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'

Editor.make().use(commonmark).use(gfm).create()
```

#### gfm `: MilkdownPlugin[]`

The GFM preset, includes all the plugins.

***

# Table

#### tableSchema `: $NodeSchema`

Schema for table node.

#### tableRowSchema `: $NodeSchema`

Schema for table row node.

#### tableHeaderSchema `: $NodeSchema`

Schema for table header node.

#### tableHeaderRowSchema `: $NodeSchema`

Schema for table header row node.

#### tableCellSchema `: $NodeSchema`

Schema for table cell node.

#### insertTableInputRule `: $InputRule`

A input rule for creating table.
For example, `|2x2|` will create a 2x2 table.

#### tablePasteRule `: $PasteRule`

A paste rule for fixing tables without header cells.
This is a workaround for some editors (e.g. Google Docs) which allow creating tables without header cells,
which is not supported by Markdown schema.
This paste rule will add header cells to the first row if it's missing.

#### tableKeymap `: $UserKeymap`

Keymap for table commands.

* `<Mod-]>`/`<Tab>`: Move to the next cell.

* `<Mod-[>`/`<Shift-Tab>`: Move to the previous cell.

* `<Mod-Enter>`: Exit the table, and break it if possible.

## Commands

#### goToPrevTableCellCommand `: $Command`

A command for moving cursor to previous cell.

#### goToNextTableCellCommand `: $Command`

A command for moving cursor to next cell.

#### exitTable `: $Command`

A command for quitting current table and insert a new paragraph node.

#### insertTableCommand `: $Command`

A command for inserting a table.
You can specify the number of rows and columns.
By default, it will insert a 3x3 table.

#### moveRowCommand `: $Command`

A command for moving a row in a table.
You should specify the `from` and `to` index.

#### moveColCommand `: $Command`

A command for moving a column in a table.
You should specify the `from` and `to` index.

#### selectRowCommand `: $Command`

A command for selecting a row.

#### selectColCommand `: $Command`

A command for selecting a column.

#### selectTableCommand `: $Command`

A command for selecting a table.

#### deleteSelectedCellsCommand `: $Command`

A command for deleting selected cells.
If the selection is a row or column, the row or column will be deleted.
If all cells are selected, the table will be deleted.

#### addColBeforeCommand `: $Command`

A command for adding a column before the current column.

#### addColAfterCommand `: $Command`

A command for adding a column after the current column.

#### addRowBeforeCommand `: $Command`

A command for adding a row before the current row.

#### addRowAfterCommand `: $Command`

A command for adding a row after the current row.

#### setAlignCommand `: $Command`

A command for setting alignment property for selected cells.
You can specify the alignment as `left`, `center`, or `right`.
It's `left` by default.

## Table Utils

#### getCellsInCol `(columnIndexes: number | number[], selection: Selection) → CellPos[] | undefined`

Get cells in a column of a table.

#### getCellsInRow `(rowIndex: number | number[], selection: Selection) → CellPos[] | undefined`

Get cells in a row of a table.

#### getAllCellsInTable `(selection: Selection) → {pos: number, start: number, node: Node | null}[] | undefined`

Get all cells in a table.

#### selectCol `(index: number, pos?: number) → fn(tr: Transaction) → Transaction`

If the selection is in a table,
select the {index} column.

#### selectRow `(index: number, pos?: number) → fn(tr: Transaction) → Transaction`

If the selection is in a table,
select the {index} row.

#### selectTable `(tr: Transaction) → Transaction`

Select a possible table in current selection.

## Prosemirror Plugins

#### autoInsertSpanPlugin `: $Prose`

This plugin is used to fix the bug of IME composing in table in Safari browser.
original discussion in <https://discuss.prosemirror.net/t/ime-composing-problems-on-td-or-th-element-in-safari-browser/4501>

#### columnResizingPlugin `: $Prose`

This plugin is wrapping the `columnResizing` plugin from [prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables).

#### tableEditingPlugin `: $Prose`

This plugin is wrapping the `tableEditing` plugin from [prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables).

#### keepTableAlignPlugin `: $Prose`

***

# Task List

#### extendListItemSchemaForTask `: $NodeSchema`

This schema extends the [list item](/preset-commonmark#list-item) schema and add task list support for it.

#### wrapInTaskListInputRule `: $InputRule`

Input rule for wrapping a block in task list node.
Users can type `[ ] `  or `[x] `  to wrap the block in task list node with checked status.

***

# Strike Through

#### strikethroughAttr `: $MarkAttr`

HTML attributes for the strikethrough mark.

#### strikethroughSchema `: $MarkSchema`

Strikethrough mark schema.

#### toggleStrikethroughCommand `: $Command`

A command to toggle the strikethrough mark.

#### strikethroughKeymap `: $UserKeymap`

Keymap for the strikethrough mark.

* `Mod-Alt-x` - Toggle the strikethrough mark.

#### strikethroughInputRule `: $InputRule`

Input rule to create the strikethrough mark.

***

# Footnote

#### footnoteDefinitionSchema `: $NodeSchema`

Footnote definition node schema.

#### footnoteReferenceSchema `: $NodeSchema`

Footnote reference node schema.

***

# Others

#### remarkGFMPlugin `: $Remark`

This plugin is wrapping the [remark-gfm](https://github.com/remarkjs/remark-gfm).

#### markInputRules `: MilkdownPlugin[]`
