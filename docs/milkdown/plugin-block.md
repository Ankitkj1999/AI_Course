# @milkdown/plugin-block

Block plugin for [milkdown](https://milkdown.dev/) to add a handler for every block.

## Usage

#### Create Block View

Create block view is simple.
All you need to do is to implement the [Prosemirror Plugin.view](https://prosemirror.net/docs/ref/#state.PluginSpec.view).

```typescript
import { BlockProvider } from '@milkdown/kit/plugin/block'

function createBlockPluginView(ctx) {
  return (view) => {
    const content = document.createElement('div')

    const provider = new BlockProvider({
      ctx,
      content: this.content,
    })

    return {
      update: (updatedView, prevState) => {
        provider.update(updatedView, prevState)
      },
      destroy: () => {
        provider.destroy()
        content.remove()
      },
    }
  }
}
```

#### Bind Block View

You need to bind the block view to the plugin in `editor.config`.

```typescript
import { Editor } from '@milkdown/core'
import { block } from '@milkdown/plugin-block'

Editor.make()
  .config((ctx) => {
    ctx.set(block.key, {
      view: blockPluginView(ctx),
    })
  })
  .use(block)
  .create()
```

#### block `: BlockPlugin`

All plugins exported by this package.

## Use with React

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/Milkdown/examples/tree/main/react-block)

## Use with Vue

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/Milkdown/examples/tree/main/vue-block)

## API

#### class BlockProvider

A provider for creating block.

* `new ` **`BlockProvider`**`(options: BlockProviderOptions)`

* **`active`**`: Readonly | null`\
  The context of current active node.

* **`update`**`()`\
  Update provider state by editor view.

* **`destroy`**`()`\
  Destroy the block.

* **`show`**`(active: Readonly)`\
  Show the block.

* **`hide`**`()`\
  Hide the block.

#### interface BlockProviderOptions

Options for creating block provider.

* **`ctx`**`: Ctx`\
  The context of the editor.

* **`content`**`: HTMLElement`\
  The content of the block.

* **`shouldShow`**`?: fn(view: EditorView, prevState?: EditorState) → boolean`\
  The function to determine whether the tooltip should be shown.

* **`getOffset`**`?: fn(deriveContext: DeriveContext) → OffsetOptions`\
  The offset to get the block. Default is 0.

* **`getPosition`**`?: fn(deriveContext: DeriveContext) → Omit`\
  The function to get the position of the block. Default is the position of the active node.

* **`getPlacement`**`?: fn(deriveContext: DeriveContext) → Placement`\
  The function to get the placement of the block. Default is 'left'.

* **`middleware`**`?: instantiated[]`\
  Other middlewares for floating ui. This will be added after the internal middlewares.

* **`floatingUIOptions`**`?: Partial`\
  Options for floating ui. If you pass `middleware` or `placement`, it will override the internal settings.

* **`root`**`?: HTMLElement`\
  The root element that the block will be appended to.

#### blockPlugin `: $Prose`

The block prosemirror plugin.

#### blockSpec `: $Ctx`

A slice contains a factory that will return a plugin spec.
Users can use this slice to customize the plugin.

#### blockConfig `: $Ctx`

A slice contains the block config.
Possible properties:

* `filterNodes`: A function to filter nodes that can be dragged.

#### type ActiveNode ` = Readonly`

#### interface DeriveContext

The context of the block provider.

* **`ctx`**`: Ctx`

* **`active`**`: Readonly`

* **`editorDom`**`: HTMLElement`

* **`blockDom`**`: HTMLElement`

