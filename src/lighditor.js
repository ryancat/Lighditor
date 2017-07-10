// @flow

// Web editor should support
// 1. Basic type in editor
// 2. Get/Set cursor position
// 3. Get/Set selection
// 4. Get/Set text content
// 5.
//

import lighditorStyle from './lighditor.scss'

type Position = {
  row: number,
  column: number
  // charIndex: number
}

type Selection = {
  start: Position,
  end: Position
}

type LighditorConfig = {
  initTextContent: string
}

type LighditorProps = {
  element: HTMLElement,
  config: ?LighditorConfig
}

type LighditorState = {
  textContent: string,
  cursorPosition: Position,
  selection: {
    start: Position,
    end: Position
  }
}

type RowInfo = {
  element: HTMLElement | Text,
  row: number
}

const EditorClass = {
  CONTAINER: 'lighditorContainer',
  ELEMENT: 'lighditorRawElement',
  EDITOR_ELEMENT: 'lighditorElement',
  EDITOR_ROW: 'lighditorRow'
}

const positionTypeEnum = {
  START: 'start',
  END: 'end'
}

type PositionTypeEnum = $Keys<typeof positionTypeEnum>

// Feature detection
let featureGetSelection = !!window.getSelection
let featureCreateRange = !!document.createRange

class Lighditor {

  element: HTMLElement
  editorElement: HTMLElement
  editorState: LighditorState
  editorConfig: LighditorConfig
  _openParenthesis: number[]
  _processPosition: Position

  constructor (props: LighditorProps) {
    this.element = props.element
    this.editorConfig = props.config || {
      initTextContent: ''
    }

    // this.resetRender()
    // this.build()
    // this.listen()
    // @attachListeners()
    //

  }

  resetRender (): void {
    this.setEditorState({
      textContent: '',
      cursorPosition: { row: 0, column: 0 },
      selection: {
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 }
      }
    })
  }

  build (config: ?LighditorConfig) {
    // Error checks
    if (typeof this.element === 'undefined') {
      throw new Error('Missing element for editor')
    }

    let elementParent = this.element.parentElement
    if (!elementParent) {
      throw new Error('Element set to html document is not supported')
    }

    // Update config
    if (typeof config !== 'undefined') {
      for (let key in config) {
        if (config.hasOwnProperty(key)) {
          this.editorConfig[key] = config[key]
        }
      }
    }

    let wrapperElement: HTMLDivElement = document.createElement('div')
    wrapperElement.classList.add(EditorClass.CONTAINER)

    // Replace with input element
    elementParent.replaceChild(wrapperElement, this.element)
    this.element.classList.add(EditorClass.ELEMENT)

    // Make sure the original element is not shown
    this.element.style.display = 'none'
    wrapperElement.appendChild(this.element)

    // Create editor
    this.editorElement = document.createElement('div')
    this.editorElement.classList.add(EditorClass.EDITOR_ELEMENT)

    // Make editor element editable
    this.editorElement.setAttribute('contenteditable', 'true')
    wrapperElement.appendChild(this.editorElement)

    // Reset editor state
    this.resetRender()

    // Attach listeners
    this.listen()

    // Setup placeholder or init text
    this.setTextContent(this.editorConfig.initTextContent || '')
  }

  listen (): void {
    this.editorElement.addEventListener('keydown', this.handleKeydown.bind(this))
    this.editorElement.addEventListener('keyup', this.handleKeyup.bind(this))
  }

  /**
   * Render the editor element inner html based on current editor state
   */
  render (): void {
    // Render the text content
    let textContent: string = this.editorState.textContent
    let textContentRows: string[] = textContent.split('\n')
    let html: string = ''

    textContentRows.forEach((textContentRow) => {
      html += '<div class="' + EditorClass.EDITOR_ROW + '" data-lighditor-type="row">' + textContentRow + '</div>'
    })

    this.editorElement.innerHTML = html

    // Render the selection/cursor
    this.restoreSelection()
  }

  /***** Event handlers *****/
  handleKeydown (evt: KeyboardEvent) {

  }

  handleKeyup (evt: KeyboardEvent) {
    let textContent: string = this._getInputText()

    // TODO: update selection if arrow key is up
    this.updateSelection()

    // TODO: We may not need to update the whole editor text content
    // but only the section that is actually changed
    // this.saveSelection()
    this.setTextContent(textContent)
    // this.restoreSelection()
  }

  handleMouseup (evt: MouseEvent) {
    this.updateSelection()
  }

  /***** Lifecycle events *****/
  /**
   * Called after text content is changed
   */
  onTextContentChange (newTextContent: string, oldTextContent: string): void {}

  /**
   * Called after selection is changed
   */
  onSelectionChange (newSelection: Selection, oldSelection: Selection): void {}


  /***** Setters *****/
  setEditorState (editorState: LighditorState): void {
    console.log('calling setEditorState: ', editorState)

    this.editorState = {
      ...editorState
    }

    // When we set editor state, we need to re-render the content
    // based on given parser
    setTimeout(() => {
      this.render()
    })
  }

  setTextContent (textContent: string): void {
    let oldTextContent = this.editorState.textContent

    this.setEditorState({
      ...this.editorState,
      textContent
    })

    this.onTextContentChange(textContent, oldTextContent)
  }

  setSelection (selection: Selection): void {
    let oldSelection = this.editorState.selection

    this.setEditorState({
      ...this.editorState,
      selection
    })

    this.onSelectionChange(selection, oldSelection)
  }

  /***** Text content *****/
  _dfsTraverseNode (callback: (node: Node, row: number, column: number) => ?boolean): void {
    let nodeStack = [this.editorElement]
    let row: number = 0
    let column: number = 0
    let node: ?Node

    while (node = nodeStack.pop()) {
      if (this.isRowElement(node)) {
        row = this.getRowIndex(node)
        column = 0
      }

      // if (node instanceof Text) {
      //   if (callback(node, row, column)) {
      //     column += node.length
      //     break;
      //   }
      // } else {
        
      // }

      if (callback(node, row, column)) {
        break
      }

      if (node instanceof Text) {
        column += node.length
      }

      if (node.childNodes) {
        let childNodes = node.childNodes
        let childIndex: number = childNodes.length

        while (childIndex--) {
          nodeStack.push(childNodes[childIndex])
        }
      }
    }
  }

  /**
   * Get the text from the actual contents, including new lines
   */
  _getInputText (): string {
    let contents: Array<string[]> = []
    // let lastRowElement: Node = this.getRowElementByIndex(this.editorElement.childNodes.length - 1)

    this._dfsTraverseNode((node: Node, row: number, column: number) => {
      if (this.isRowElement(node)) {
        // Warn if current row has content already. By DFS we are guaranteed
        // the row element is ran againast with first
        if (typeof contents[row] !== 'undefined') {
          console.warn('Row ' + row + ' has rendered')
        }

        // Make sure each row has a new line
        contents[row] = []
      }

      if (node instanceof Text) {
        let rowContent = contents[row]

        // Warn if we have empty positions
        if (column > 0 && typeof rowContent[column - 1] === 'undefined') {
          console.warn('Row ' + row + ' has unassigned character at column ' + (column - 1))
          // Need to make up all unassigned position with space key
          let col = column
          while (typeof rowContent[col - 1] === 'undefined') {
            rowContent[col - 1] = ' '
            col--
          }

          // TODO: Should we return true and stop traversal?
        }

        // Warn if we already have character at column position
        if (rowContent.length > column) {
          console.error('Row ' + row + ' has exist character at column ' + column)
          return true
        }

        // Copy nodeText to row content
        let nodeText = node.textContent
        for (let i = column; i < nodeText.length; i++) {
          rowContent[i] = nodeText[i - column]
        }
      } 
    })

    return contents.map((rowArray) => { return rowArray.join('') }).join('\n')
  }

  getRowIndex (node: Node): number {
    let rowNode: ?RowInfo = this._getParentRowNode(node)
    if (!rowNode) {
      return -1
    } else {
      return rowNode.row
    }
  }

  getRowElementByIndex (row: number): ?HTMLElement | ?Text {
    let node = this.editorElement.childNodes[row]
    if ((node instanceof HTMLElement) || (node instanceof Text)) {
      return node
    } else {
      return null
    }
  }

  isRowElement (node: Node): boolean {
    return node.parentElement === this.editorElement
  }

  /***** Cursor and selection *****/
  getSelection (): Selection {
    return this.editorState.selection
  }

  /**
   * Recursively goes up and get the row node from current node
   */
  _getParentRowNode (node: Node): ?RowInfo {
    let runningNode = node

    while (runningNode && runningNode !== this.editorElement) {
      // if ((runningNode instanceof HTMLElement) && runningNode.dataset['lighditorType'] === 'row') {
      //   // Found the row wrapper
      //   let rowCount = 0
      //   let n = runningNode
      //   for (; (n = n.previousSibling); rowCount++) {}

      //   return {
      //     element: runningNode,
      //     row: rowCount
      //   }
      // }

      if (((runningNode instanceof HTMLElement) || (runningNode instanceof Text)) && runningNode.parentElement === this.editorElement) {
        let rowCount = 0
        let n = runningNode
        for (; (n = n.previousSibling); rowCount++) {}

        return {
          element: runningNode,
          row: rowCount
        }
      }

      runningNode = runningNode.parentElement
    }

    return null
  }

  _getSelectionNodePosition (positionType: PositionTypeEnum): ?Position {
    if (featureGetSelection && featureCreateRange) {
      let currentSelection = window.getSelection()
      let node: HTMLElement | Text

      switch (positionType) {
        case 'START':
          node = currentSelection.anchorNode
          break;

        case 'END':
          node = currentSelection.focusNode
          break;

        default:
          node = currentSelection.focusNode
      }

      if (!node) {
        return null
      }

      let rowInfo: ?RowInfo = this._getParentRowNode(node)

      if (!rowInfo) {
        return null
      }

      let rangeBeforeNodeInRow = document.createRange()
      rangeBeforeNodeInRow.selectNodeContents(rowInfo.element)
      rangeBeforeNodeInRow.setEnd(node, 0)

      // let rangeBeforeNodeInEditor = document.createRange()
      // rangeBeforeNodeInEditor.selectNodeContents(this.editorElement)
      // rangeBeforeNodeInEditor.setEnd(node, 0)

      return {
        row: rowInfo.row,
        column: rangeBeforeNodeInRow.toString().length
        // charIndex: rangeBeforeNodeInEditor.toString().length
      }
    }
    else {
      // TODO: add support for old IE
      return null
    }
  }

  /**
   * Get the current selection's start position
   */
  _getSelectionStartNodePosition (): ?Position {
    return this._getSelectionNodePosition('START')
  }

  /**
   * Get the current selection's end position
   */
  _getSelectionEndNodePosition (): ?Position {
    return this._getSelectionNodePosition('END')
  }

  /**
   * Update the selection state from user interaction
   */
  updateSelection (): void {
    if (featureGetSelection && featureCreateRange) {
      let currentSelection = window.getSelection()

      if (!currentSelection.focusNode) {
        return
      }

      let range = currentSelection.getRangeAt(0)
      let selectionStartPosition: ?Position = this._getSelectionStartNodePosition()
      let selectionEndPosition: ?Position = this._getSelectionEndNodePosition()

      if (selectionStartPosition && selectionEndPosition) {
        this.setSelection({
          start: {
            row: selectionStartPosition.row,
            column: selectionStartPosition.column + range.startOffset
          },
          end: {
            row: selectionEndPosition.row,
            column: selectionEndPosition.column + range.endOffset
          }
        })
      }
    }
    else {
      // TODO: add support for old IE
    }

    // if (sel = window.getSelection?()) and document.createRange?
    //   return @selection = null unless sel.focusNode

    //   range = sel.getRangeAt(0)
    //   selectionStartPos = @_getNodeStartPos()

    //   if selectionStartPos >= 0
    //     start = selectionStartPos + range.startOffset
    //     return {
    //       start: start
    //       end: start + range.toString().length
    //     }
    //   else
    //     return null

    //   # preSelectionRange = range.cloneRange()
    //   # preSelectionRange.selectNodeContents @inputMask
    //   # preSelectionRange.setEnd range.startContainer, range.startOffset
    //   # start = preSelectionRange.toString().length

    //   # return {
    //   #   start: start
    //   #   end: start + range.toString().length
    //   # }

    // else
    //   console.warn 'Editor selection persist feature does not support'
    //   return null
  }

  saveSelection (): void {

  }

  // Restore the saved selection and cursor position
  // REF: https://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html
  restoreSelection (): void {
    if (featureGetSelection && featureCreateRange) {
      let selection = this.editorState.selection

      if (!selection) {
        return
      }

      // Set the range from start
      let range = document.createRange()
      // let startRowElement = this.editorElement.querySelector('.' + EditorClass.EDITOR_ROW + '[data-lighditor-row="' + selection.start.row + '"]')
      // let endRowElement = this.editorElement.querySelector('.' + EditorClass.EDITOR_ROW + '[data-lighditor-row="' + selection.end.row + '"]')

      let startRowElement = this.getRowElementByIndex(selection.start.row)
      let endRowElement = this.getRowElementByIndex(selection.end.row)

      if (!startRowElement || !endRowElement) {
        return
      }

      range.setStart(startRowElement, 0)
      range.collapse(true)

      let nodeStack = [this.editorElement]
      let foundStart: boolean = false
      let stop: boolean = false
      let charIndex: number = 0

      this._dfsTraverseNode((node: Node, row: number, column: number) => {
        if (node instanceof Text) {
          if (row === selection.start.row) {
            // let nextCharIndex = charIndex + node.length

            let endTextNodeColumn = column + node.length
            let startColumn = selection.start.column
            let endColumn = selection.end.column

            if (!foundStart && startColumn >= column && startColumn <= endTextNodeColumn) {
              // Found the text node where selection starts
              range.setStart(node, startColumn - column)
              foundStart = true
            }

            if (foundStart && endColumn >= column && endColumn <= endTextNodeColumn) {
              // Found the text node where selection ends
              range.setEnd(node, endColumn - column)
            }

            // charIndex = nextCharIndex
          }
        }
      })

      let sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }


    // if window.getSelection? and document.createRange?
    //   return unless selection

    //   charIndex = 0
    //   range = document.createRange()
    //   range.setStart @inputMask, 0
    //   range.collapse true

    //   nodeStack = [@inputMask]
    //   foundStart = false
    //   stop = false

    //   while (not stop and (node = nodeStack.pop()))
    //     if node.nodeType is window.Node.TEXT_NODE
    //       nextCharIndex = charIndex + node.length
    //       if not foundStart and selection.start >= charIndex and selection.start <= nextCharIndex
    //         range.setStart node, selection.start - charIndex
    //         foundStart = true

    //       if foundStart && selection.end >= charIndex && selection.end <= nextCharIndex
    //         range.setEnd(node, selection.end - charIndex)
    //         stop = true

    //       charIndex = nextCharIndex

    //     else
    //       children = node.childNodes
    //       nodeIndex = children.length
    //       while nodeIndex--
    //         nodeStack.push children[nodeIndex]

    //   sel = window.getSelection()
    //   sel.removeAllRanges()
    //   sel.addRange range
    // else
    //   console.warn 'Editor selection persist feature does not support'

    // @selection = null
  }

  getCursorPosition (): Position {
    let cursorPosition: Position = { row: 0, column: 0, charIndex: 0 }



    return cursorPosition
  }

}

window.Lighditor = Lighditor

// goog.provide 'opa.utils.Editor'

// goog.require 'opa.utils.expressionParser.Parser'
// goog.require 'opa.utils.expressionParser.TokenTypes'

// # Import your own editor parser
// expressionParser = opa.utils.expressionParser.Parser
// tokenTypes = opa.utils.expressionParser.TokenTypes

// expressionParser('ADD_EXP  ([Field 1], [Field 2] )')

// EditorClass =
//   CONTAINER: 'opaEditorContainer'
//   INPUT: 'opaEditorInput'
//   INPUT_MASK: 'opaEditorInputMask'

// class Editor

//   constructor: (@prop = {}) ->
//     @inputElement = @prop.inputElement

//     @resetRender()
//     @buildEditor()
//     @listen()
//     @attachListeners()

//   resetRender: () ->
//     @renderedHtml = ''
//     @parenthesisId = 0
//     @processPos = 0
//     @openParenthesis = []

//   buildEditor: () ->
//     # Error checks
//     if not @inputElement
//       throw new Error 'Missing input element for editor'

//     wrapperElement = document.createElement 'div'
//     wrapperElement.classList.add EditorClass.CONTAINER

//     # Replace with input element
//     @inputElement.parentNode.replaceChild wrapperElement, @inputElement
//     @inputElement.classList.add EditorClass.INPUT
//     # Make sure the original input is not shown
//     @inputElement.style.display = 'none'
//     wrapperElement.appendChild @inputElement

//     # Create the autocomplete input mask
//     @inputMask = document.createElement 'div'
//     @inputMask.classList.add EditorClass.INPUT_MASK
//     # Make the HTML div element editable
//     @inputMask.setAttribute 'contenteditable', true
//     # Sync with input text
//     @setText @inputElement.value
//     wrapperElement.appendChild @inputMask

//   listen: () =>
//     @inputMask.addEventListener 'keydown', @handleInputMaskKeydown
//     @inputMask.addEventListener 'keyup', @handleInputMaskKeyup
//     @inputElement.addEventListener 'change', @handleInputElementChange

//   attachListeners: () ->
//     # Make sure the listeners are attached from the constructor
//     for eventName, eventHandler of @prop.eventHandlers
//       @inputMask.addEventListener eventName, eventHandler

//   # Event handlerseiejccfnkblfnvcfivcgndbrbjefiirgnejtinujjked
//   handleInputMaskKeydown: () =>
//     @syncMaskWithInput()

//   handleInputMaskKeyup: () =>
//     @syncMaskWithInput()
//     @processContent()

//   handleInputElementChange: () =>
//     newValue = @inputElement.value
//     # We need to make sure after each change, the input element
//     # and the mask have same results. We already handled the
//     # mask -> input flow. Here we handle the other flow
//     @setText(newValue) if newValue isnt @inputMask.innerText

//   # Utils
//   syncMaskWithInput: () =>
//     # Copy the text from input mask to the input element
//     @inputElement.value = @inputMask.innerText

//   # Render content logic
//   # convert the content text into html based on parsed result
//   processContent: (contentText = @inputMask.innerText) =>
//     @saveSelection()
//     @resetRender()
//     parsed = expressionParser contentText
//     @renderContent parsed
//     @inputMask.innerHTML = @renderedHtml
//     @restoreSelection()

//   getSpaceHtml: (numOfSpace = 0) ->
//     return '' if numOfSpace is 0
//     spaceHtml = '''<span class="editorSpace">'''
//     while numOfSpace > 0
//       spaceHtml += ' '
//       numOfSpace--
//     spaceHtml += '''</span>'''
//     return spaceHtml

//   addSpaceHtmlBefore: (node) =>
//     if @processPos < node.charFrom
//       @renderedHtml += @getSpaceHtml(node.charFrom - @processPos)
//       @processPos = node.charFrom

//   addSpaceHtmlAfter: (node) =>
//     if @processPos < node.charTo
//       @renderedHtml += @getSpaceHtml(node.charTo - @processPos)
//       @processPos = node.charTo

//   addParenthesis: () ->
//     @renderedHtml += """<span class="editorOpenParenthesis" data-parenthesis-id="#{@parenthesisId}">(</span>"""
//     @openParenthesis.push parenthesisId
//     @parenthesisId++

//   removeParenthesis: (parenthesisElement) ->
//     parenthesisId = parenthesisElement.dataset.parenthesisId
//     unless _.isUndefined(parenthesisId)
//       allParenthesis = @inputMask.querySelectorAll "[data-parenthesis-id='#{parenthesisId}']"
//       @inputMask.removeChild child for child in allParenthesis

//   renderChildren: (children) =>
//     sortedNodes = _.sortBy children, (node) -> return node.charFrom
//     # Render each node in the order of char from
//     for node in sortedNodes
//       @addSpaceHtmlBefore node
//       @renderContent node

//   renderContent: (parsedNode) =>
//     @addSpaceHtmlBefore parsedNode

//     switch parsedNode.type
//       when tokenTypes.COMPOUND
//         @renderChildren parsedNode.body
//         @addSpaceHtmlAfter parsedNode

//       when tokenTypes.CALL_EXP
//         # First render callee
//         callee = parsedNode.callee
//         @addSpaceHtmlBefore callee
//         @renderContent callee

//         # Render '('
//         addParenthesis()

//         # Render the arguments
//         @renderChildren parsedNode.arguments.list
//         @addSpaceHtmlAfter parsedNode

//       when tokenTypes.LITERAL, tokenTypes.NUMERIC_LITERAL, tokenTypes.STRING_LITERAL
//         @renderedHtml += """
//           <span class="editorToken editor#{parsedNode.type}" data-char-from="#{parsedNode.charFrom}" data-char-to="#{parsedNode.charTo}">#{parsedNode.raw}</span>
//         """

//       when tokenTypes.IDENTIFIER
//         @renderedHtml += """
//           <span class="editorToken editor#{parsedNode.type}"  data-char-from="#{parsedNode.charFrom}" data-char-to="#{parsedNode.charTo}">#{parsedNode.name}</span>
//         """

//     @processPos = parsedNode.charTo

//   # DOM element getter
//   getContainer: () => @inputMask.parentNode

//   # Cursor related
//   getCaretPosition: () =>
//     # caretPos = 0

//     # if sel = window.getSelection?()
//     #   if sel.rangeCount
//     #     range = sel.getRangeAt(0)
//     #     caretPos = range.endOffset if range.commonAncestorContainer.parentNode is @inputMask

//     # return caretPos

//     currentSelection = @getSelection()
//     if currentSelection
//       return currentSelection.end
//     else return 0

//   setCaretPosition: (cursorPosition) =>
//     # if (sel = window.getSelection?()) and (range = document.createRange?()) and @inputMask.childNodes[0]
//     #   range.setStart node, cursorPosition
//     #   range.collapse true
//     #   sel.removeAllRanges()
//     #   sel.addRange range
//     #   @inputMask.focus()

//     if _.isUndefined cursorPosition
//       if @selection
//         cursorStartPosition = @selection.start
//         cursorEndPosition = @selection.end
//       else if currentSelection = @getSelection()
//         cursorStartPosition = currentSelection.start
//         cursorEndPosition = currentSelection.end
//     else
//       cursorStartPosition = cursorPosition
//       cursorEndPosition = cursorPosition

//     selection =
//       start: cursorStartPosition
//       end: cursorEndPosition

//     @restoreSelection selection

//   getHtmlNodeUnderCursor: () ->
//     return sel.focusNode if sel = window.getSelection?()

//   _getNodeStartPos: () ->
//     if (sel = window.getSelection?()) and document.createRange?
//       return -1 unless focusNode = sel.focusNode

//       preSelectionRange = document.createRange()
//       preSelectionRange.selectNodeContents @inputMask
//       preSelectionRange.setEnd focusNode, 0
//       return preSelectionRange.toString().length

//     else
//       console.warn 'Editor selection persist feature does not support'
//       return -1

//   getNodePosUnderCursor: () =>
//     if (sel = window.getSelection?()) and document.createRange?
//       return null unless focusNode = sel.focusNode

//       start = @_getNodeStartPos()
//       return null unless start >= 0

//     # if (sel = window.getSelection?()) and document.createRange?
//     #   return null unless focusNode = sel.focusNode

//     #   preSelectionRange = document.createRange()
//     #   preSelectionRange.selectNodeContents @inputMask
//     #   preSelectionRange.setEnd focusNode, 0
//     #   start = preSelectionRange.toString().length

//       return {
//         start: start
//         end: start + focusNode.toString().length
//       }
//     else
//       console.warn 'Editor selection persist feature does not support'
//       return null

//   # Get the current selection and cursor position
//   # REF: https://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html
//   getSelection: () =>
//     if (sel = window.getSelection?()) and document.createRange?
//       return @selection = null unless sel.focusNode

//       range = sel.getRangeAt(0)
//       selectionStartPos = @_getNodeStartPos()

//       if selectionStartPos >= 0
//         start = selectionStartPos + range.startOffset
//         return {
//           start: start
//           end: start + range.toString().length
//         }
//       else
//         return null

//       # preSelectionRange = range.cloneRange()
//       # preSelectionRange.selectNodeContents @inputMask
//       # preSelectionRange.setEnd range.startContainer, range.startOffset
//       # start = preSelectionRange.toString().length

//       # return {
//       #   start: start
//       #   end: start + range.toString().length
//       # }

//     else
//       console.warn 'Editor selection persist feature does not support'
//       return null

//   # Save the current selection and cursor position
//   # REF: https://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html
//   saveSelection: () => @selection = @getSelection()

//   # Restore the saved selection and cursor position
//   # REF: https://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html
//   restoreSelection: (selection = @selection) =>
//     if window.getSelection? and document.createRange?
//       return unless selection

//       charIndex = 0
//       range = document.createRange()
//       range.setStart @inputMask, 0
//       range.collapse true

//       nodeStack = [@inputMask]
//       foundStart = false
//       stop = false

//       while (not stop and (node = nodeStack.pop()))
//         if node.nodeType is window.Node.TEXT_NODE
//           nextCharIndex = charIndex + node.length
//           if not foundStart and selection.start >= charIndex and selection.start <= nextCharIndex
//             range.setStart node, selection.start - charIndex
//             foundStart = true

//           if foundStart && selection.end >= charIndex && selection.end <= nextCharIndex
//             range.setEnd(node, selection.end - charIndex)
//             stop = true

//           charIndex = nextCharIndex

//         else
//           children = node.childNodes
//           nodeIndex = children.length
//           while nodeIndex--
//             nodeStack.push children[nodeIndex]

//       sel = window.getSelection()
//       sel.removeAllRanges()
//       sel.addRange range
//     else
//       console.warn 'Editor selection persist feature does not support'

//     @selection = null

//   getNodeUnderCursor: (cursorPosition) ->
//     if window.getSelection? and document.createRange?
//       sel = window.getSelection()


//   # # Set the selection to be previous word under cursor
//   # getWordSelectionUnderCursor: (fullString, cursorPosition) ->
//   #   preWordRegexp = /^.*?\s*([^\s]*)$/ # Lazy matching
//   #   postWordRegexp = /^([^\s]*)\s*.*$/
//   #   preWord = fullString.slice 0, cursorPosition
//   #   postWord = fullString.slice cursorPosition

//   #   preMatches = preWord.match preWordRegexp
//   #   postMatches = postWord.match postWordRegexp

//   #   # There should always be matches for both pre and post matches
//   #   return null if not preMatches or not postMatches

//   #   start: cursorPosition - preMatches[1].length
//   #   end: cursorPosition + postMatches[1].length
//   #   selectedText: preMatches[1] + postMatches[1]
//   #   fullText: fullString

//   # Editor operation
//   # setText: (editableElement, cursorPosition, textObj, setType) ->
//   # Set the focused word to be update
//   # The focused word is the same to selection if selection exists.
//   # Otherwise it is the node where under the cursor
//   setFocusedWord: () =>
//     @focusedWord = @getSelection()

//     # if currentSelection.start is currentSelection.end
//     #   @focusedWord = @getNodePosUnderCursor()
//     # else
//     #   @focusedWord = currentSelection

//   # The defination of focused word is the word to be updated
//   # In most case it's the same to selection, but in some cases
//   # we want to update the un-selected words (to be supported)
//   updateFocusedWord: (wordToUpdate) =>
//     return unless wordToUpdate

//     if @focusedWord
//       oldString = @inputMask.innerText
//       newString = oldString.slice(0, @focusedWord.start) \
//         + wordToUpdate \
//         + oldString.slice(@focusedWord.end)
//       @setCaretPosition @focusedWord.start + wordToUpdate.length
//       @setText newString
//     else
//       @setCaretPosition @inputMask.innerText.length + wordToUpdate.length
//       # Append the focusedWord name into autocomplete input box
//       # Only append the remaining strings to complete typing
//       @setText(@inputMask.innerText + wordToUpdate)

//     @syncMaskWithInput()

//   setText: (contentText) =>
//     # @inputMask.innerText = contentText
//     @processContent contentText

//   getText: () => @inputMask.innerText
//   focusEditor: () =>
//     @inputMask.focus()

// opa.utils.Editor = Editor
