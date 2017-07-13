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

const lighditorUtil = {

  throttle: (callback: () => mixed, interval: number = 0) => {
    let lastCalledTimestamp: ?number,
        timeoutId

    function refreshTimeout () {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        lastCalledTimestamp = null
      }, interval)
    }

    function throttled () {
      if (!lastCalledTimestamp) {
        lastCalledTimestamp = Date.now()
        refreshTimeout()
        callback()
      }
    }

    return throttled
  }

}

class Lighditor {

  element: HTMLElement
  editorElement: HTMLElement
  editorState: LighditorState
  editorConfig: LighditorConfig
  _openParenthesis: number[]
  _processPosition: Position
  render: () => mixed

  constructor (element: HTMLElement, config: LighditorConfig) {
    this.element = element
    this.editorConfig = config

    // Error checks
    if (typeof this.element === 'undefined') {
      throw new Error('Missing element for editor')
    }

    // Build the editor DOM
    this._build()

    // Reset editor state
    this._resetRender()

    // Attach listeners
    this._listen()

    // Setup placeholder or init text
    this.setTextContent(this.editorConfig.initTextContent)

    // For debugging
    Lighditor.debug(() => { window.lighditor = this })

    // this.resetRender()
    // this.build()
    // this.listen()
    // @attachListeners()
    //

    // Decorate prototype
    // this.render = lighditorUtil.debounce(this.render.bind(this))
  }

  // Create a instance of Lighditor class
  static create (element: HTMLElement, config: ?LighditorConfig) {
    let actualConfig: LighditorConfig = {
      initTextContent: ''
    }

    // make sure defaults in config
    if (typeof config !== 'undefined') {
      for (let key in config) {
        if (config.hasOwnProperty(key)) {
          actualConfig[key] = config[key]
        }
      }
    }

    return new Lighditor(element, actualConfig)
  }

  static destroy (editor: Lighditor): boolean {
    if (editor instanceof Lighditor) {
      return editor._destroy()
    } else {
      Lighditor.warn('Try desgroy non-Lighditor: ', editor)
      return true
    }
  }

  static enableLog () {
    localStorage.setItem('lighditor.enableLog', 'true')
  }

  static disableLog () {
    localStorage.setItem('lighditor.enableLog', 'false')
  }

  static log () {
    if (localStorage.getItem('lighditor.enableLog') === 'true') {
      console.log.apply(null, arguments)
    }
  }

  static warn () {
    if (localStorage.getItem('lighditor.enableLog') === 'true') {
      console.warn.apply(null, arguments)
    }
  }

  static enableDebug () {
    localStorage.setItem('lighditor.enableDebug', 'true')
  }

  static disableDebug () {
    localStorage.setItem('lighditor.enableDebug', 'false')
  }

  static debug (callback: () => mixed) {
    if (localStorage.getItem('lighditor.enableLog') === 'true') {
      callback()
    }
  }

  /***** Setters *****/
  setTextContent (textContent: string): void {
    let oldTextContent = this.editorState.textContent

    if (textContent === oldTextContent) {
      return
    }

    this._setEditorState({
      ...this.editorState,
      textContent
    })

    this.onTextContentChange(textContent, oldTextContent)
  }

  setSelection (selection: Selection): void {
    let oldSelection = this.editorState.selection

    this._setEditorState({
      ...this.editorState,
      selection
    }, true)

    this.onSelectionChange(selection, oldSelection)
  }

  /***** Getters *****/
  getSelection (): Selection {
    return this.editorState.selection
  }

  getTextContent (): string {
    return this.editorState.textContent
  }

  getCursorPosition (): Position {
    return this.getSelection().end
  }

  /***** Build and unbuild *****/
  _build (): void {
    let elementParent = this.element.parentElement
    if (!elementParent) {
      throw new Error('Element set to html document is not supported')
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
  }

  _destroy (): boolean {
    this._resetRender()
    let wrapperElement = this.editorElement.parentElement,
        elementParent: Element

    if (!(wrapperElement instanceof HTMLElement)) {
      Lighditor.warn('The wrapper of editor is not an HTMLElement, which should not happen')
    }

    if (wrapperElement && wrapperElement.parentElement instanceof Element) {
       elementParent = wrapperElement.parentElement
       elementParent.replaceChild(wrapperElement, this.element)
    }

    return delete this.editorElement
  }

  /***** render and state *****/
  /**
   * Render the editor element inner html based on current editor state
   */
  _render (): void {
    // Render the text content
    let textContent: string = this.editorState.textContent
    let textContentRows: string[] = textContent.split('\n')
    let html: string = ''

    textContentRows.forEach((textContentRow) => {
      html += '<div class="' + EditorClass.EDITOR_ROW + '" data-lighditor-type="row">' + textContentRow + '</div>'
    })

    this.editorElement.innerHTML = html

    // Attach the current selection/cursor
    this._restoreSelection()
  }

  _resetRender (): void {
    this._setEditorState({
      textContent: '',
      cursorPosition: { row: 0, column: 0 },
      selection: {
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 }
      }
    })
  }

  _setEditorState (editorState: LighditorState, silence: boolean = false): void {
    Lighditor.log((silence ? 'silently ' : '') + 'set editor state: ', editorState)

    this.editorState = {
      ...editorState
    }

    // When we set editor state, we need to re-render the content
    // based on given parser
    // TODO: Considering use virtual dom to render editor
    if (!silence) {
      this._render()
    }
  }

  /***** Events *****/
  _listen (): void {
    this.editorElement.addEventListener('keydown', this._handleKeydown.bind(this))
    this.editorElement.addEventListener('keyup', this._handleKeyup.bind(this))
    this.editorElement.addEventListener('mouseup', this._handleMouseup.bind(this))
  }

  _handleKeydown (evt: KeyboardEvent) {

  }

  _handleKeyup (evt: KeyboardEvent) {
    let textContent: string = this._compileTextContent()

    // TODO: update selection if arrow key is up
    this._updateSelection()

    // TODO: We may not need to update the whole editor text content
    // but only the section that is actually changed
    // this.saveSelection()
    this.setTextContent(textContent)
    // this._restoreSelection()
  }

  _handleMouseup (evt: MouseEvent) {
    this._updateSelection()
  }

  /***** Lifecycle *****/
  /**
   * Called after text content is changed
   */
  onTextContentChange (newTextContent: string, oldTextContent: string): void {}

  /**
   * Called after selection is changed
   */
  onSelectionChange (newSelection: Selection, oldSelection: Selection): void {}


  /***** Text content *****/
  _dfsTraverseNode (callback: (node: Node, row: number, column: number) => ?boolean): void {
    let nodeStack = [this.editorElement],
        row: number = 0,
        column: number = 0,
        node: ?Node,
        // When there are <br> element in row, we need to add extra row
        extraRowCount: number = 0

    while (node = nodeStack.pop()) {
      if (this._isRowElement(node)) {
        row = this._getRowIndex(node) + extraRowCount
        column = 0
      }

      /** Fix for firefox */
      if (this._isBrElement(node)) {
        extraRowCount++
        row++
        column = 0
      }
      /** Fix for firefox end */

      if (callback(node, row, column)) {
        break
      }

      if (node instanceof Text) {
        column += node.length
      }

      if (!this._isRowEmpty(node) && node.childNodes && node.childNodes.length) {
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
   *
   * When hitting new line (enter key):
   * 1. chrome/safari will clone the current row and move the rest of text to the new row.
   * 2. firefox will keep the two piece of string in the same row and add a 'br' element
   */
  _compileTextContent (): string {
    let contents: Array<string[]> = []

    this._dfsTraverseNode((node: Node, row: number, column: number) => {
      console.log('Traverse node', node, row, column)

      if (this._isRowElement(node) || this._isBrElement(node)) {
        // Warn if current row has content already. By DFS we are guaranteed
        // the row element is ran againast with first
        if (typeof contents[row] !== 'undefined') {
          Lighditor.warn('Row ' + row + ' has rendered')
        }

        // Make sure each row has a new line
        contents[row] = []
      }

      if (node instanceof Text) {
        let rowContent = contents[row]

        /** Error checks **/

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

        /** Error checks end **/

        // Copy nodeText to row content
        let nodeText = node.textContent
        for (let i = column; i < nodeText.length; i++) {
          rowContent[i] = nodeText[i - column]
        }
      }
    })

    console.log('content: ', contents.map((rowArray) => { return rowArray.join('\n') }))
    console.log('------------------ Traverse node finished ------------------')

    return contents.map((rowArray) => { return rowArray.join('') }).join('\n')
  }

  /**
   * Recursively goes up and get the row node from current node
   */
  _getParentRowNode (node: Node): ?RowInfo {
    let runningNode = node

    while (runningNode && runningNode !== this.editorElement) {
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

  _getRowIndex (node: Node): number {
    let rowNode: ?RowInfo = this._getParentRowNode(node)
    if (!rowNode) {
      return -1
    } else {
      return rowNode.row
    }
  }

  _getRowElementByIndex (row: number): ?HTMLElement | ?Text {
    let node = this.editorElement.childNodes[row]
    if ((node instanceof HTMLElement) || (node instanceof Text)) {
      return node
    } else {
      return null
    }
  }

  _isRowElement (node: Node): boolean {
    return node.parentElement === this.editorElement
  }

  _isBrElement (node: Node): boolean {
    // TODO: FLOW cannot reslove HTMLBRElement!
    // return node instanceof HTMLBRElement
    return node.nodeName === 'BR'
  }

  _isRowEmpty (node: Node): boolean{
    let rowInfo: ?RowInfo = this._getParentRowNode(node)
    if (rowInfo) {
      // let childNodes = rowInfo.element.childNodes

      // childNodes

      // return childNodes && childNodes.length === 1 && this._isBrElement(childNodes[0])
      return rowInfo.element.textContent === ''
    }
    else {
      return false
    }
  }

  /***** Cursor and selection *****/
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

      return {
        row: rowInfo.row,
        column: rangeBeforeNodeInRow.toString().length
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
   * Return true if selection start is after end, as range always is from
   * start to end
   */
  _isRangeReversed (selection: Selection): boolean {
    return selection.start.row > selection.end.row || selection.start.column > selection.end.column
  }

  /**
   * Update the selection state from user interaction
   */
  _updateSelection (): void {
    if (featureGetSelection && featureCreateRange) {
      let currentSelection = window.getSelection()

      if (!currentSelection.focusNode || !currentSelection.anchorNode) {
        return
      }

      let selectionStartPosition: ?Position = this._getSelectionStartNodePosition(),
          selectionEndPosition: ?Position = this._getSelectionEndNodePosition()

      if (selectionStartPosition && selectionEndPosition) {

        let rangeStart: Position,
            rangeEnd: Position,
            range = currentSelection.getRangeAt(0)

        if (this._isRangeReversed({
              start: selectionStartPosition,
              end: selectionEndPosition
            })) {
          rangeStart = range.endOffset
          rangeEnd = range.startOffset
        } else {
          rangeStart = range.startOffset
          rangeEnd = range.endOffset
        }

        this.setSelection({
          start: {
            row: selectionStartPosition.row,
            column: selectionStartPosition.column + rangeStart
          },
          end: {
            row: selectionEndPosition.row,
            column: selectionEndPosition.column + rangeEnd
          }
        })
      }
    }
    else {
      // TODO: add support for old IE
    }
  }

  // Restore the saved selection and cursor position
  // REF: https://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html
  _restoreSelection (): void {
    if (featureGetSelection && featureCreateRange) {
      let selection = this.editorState.selection

      if (!selection) {
        return
      }

      let range = document.createRange(),
          rangeStart: Position,
          rangeEnd: Position

      if (this._isRangeReversed(selection)) {
        rangeStart = selection.end
        rangeEnd = selection.start
      } else {
        rangeStart = selection.start
        rangeEnd = selection.end
      }

      let rangeStartRowElement = this._getRowElementByIndex(rangeStart.row),
          rangeEndRowElement = this._getRowElementByIndex(rangeEnd.row),
          side1, side2

      if (!rangeStartRowElement || !rangeEndRowElement) {
        return
      }

      // Set the range to the current cursor position to start with
      range.setStart(rangeStartRowElement, 0)
      range.collapse(true)

      function getRangeSide (node: Node, nodeStartColumn: number, sideColumn: number) {
        let side = null
        let nodeCharLength: number = 0
        // if (node instanceof Text) {
        if (node instanceof Text) {
          nodeCharLength = node.length
        }

        let nodeEndColumn = nodeStartColumn + nodeCharLength

        if (sideColumn >= nodeStartColumn && sideColumn <= nodeEndColumn) {
          // Found the text node where side column inside node
          side = {
            node,
            offset: sideColumn - nodeStartColumn
          }
        }
        // }

        return side
      }

      this._dfsTraverseNode((node: Node, row: number, column: number) => {
        if (node.childNodes.length === 0) {

          if (!side1 && row === rangeStart.row) {
            side1 = getRangeSide(node, column, rangeStart.column)
            if (side1) {
              range.setStart(side1.node, side1.offset)
            }
          }

          if (!side2 && row === rangeEnd.row) {
            side2 = getRangeSide(node, column, rangeEnd.column)
            if (side2) {
              range.setEnd(side2.node, side2.offset)
            }
          }

          if (side1 && side2) {
            return true
          }
        }
      })

      let sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  /***** Utils *****/

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
//     @_restoreSelection()

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

//     @_restoreSelection selection

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
//   _restoreSelection: (selection = @selection) =>
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
