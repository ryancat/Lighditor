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
  initTextContent: string,
  viewStartRow: number,
  viewableRows: number
}

type LighditorProps = {
  element: HTMLElement,
  config: ?LighditorConfig
}

type LighditorState = {
  textContent: string,
  selection: {
    start: Position,
    end: Position
  },
  viewStartRow: number,
  viewableRows: number
}

type RowInfo = {
  container: Node,
  row: number
}

const EditorClass = {
  CONTAINER: 'lighditorContainer',
  ELEMENT: 'lighditorRawElement',
  EDITOR_ELEMENT: 'lighditorElement',
  EDITOR_ROW: 'lighditorRow',
  EDITOR_NEWLINE: 'lighditorNewline'
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
  // _openParenthesis: number[]
  // _processPosition: Position
  // render: () => mixed
  // shouldRender: (editorState: LighditorState, oldEditorState: ?LighditorState) => boolean

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

    // Make sure the paragraph separators are all <div>s
    document.execCommand("DefaultParagraphSeparator", false, "div");

    // For debugging
    Lighditor.debug(() => { window.lighditor = this })

  }

  // Create a instance of Lighditor class
  static create (element: HTMLElement, config: ?LighditorConfig) {
    let actualConfig: LighditorConfig = {
      initTextContent: '',
      viewStartRow: 0,
      viewableRows: Infinity
      // shouldRender: null
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

  static log (...args) {
    if (localStorage.getItem('lighditor.enableLog') === 'true') {
      console.log.apply(null, args)
    }
  }

  static warn (...args) {
    if (localStorage.getItem('lighditor.enableLog') === 'true') {
      console.warn.apply(null, args)
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

  static get util() {

    return {
      keycode: {
        ENTER: 13,
        BACKSPACE: 8
      },

      getKeycode: (event: KeyboardEvent): number => {
        let keyCode = event.which

        // getting the key code from event
        if (null === keyCode) {
            keyCode = event.charCode !== null ? event.charCode : event.keyCode
        }

        return keyCode
      },

      /**
       * Return true if the given key is a valid character input
       * Ref https://css-tricks.com/snippets/javascript/javascript-keycodes/
       */
      isValidCharInput: (event: KeyboardEvent): boolean => {
        let key: number = Lighditor.util.getKeycode(event)

        return (48 <= key && key <= 57) // Numbers
          || (65 <= key && key <= 90) // a-z
          || (96 <= key && key <= 111) // Keypad
          || (186 <= key && key <= 192) // period
          || (219 <= key && key <= 222) // brakets
      }
    }
  }

  /***** Setters *****/
  setTextContent (textContent: string): void {
    let oldTextContent = this.editorState.textContent

    // if (textContent === oldTextContent) {
    //   return
    // }

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
    })

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
  _render (isTextContentChange: boolean = true): void {

    if (isTextContentChange) {
      // Render the text content
      let textContent: string = this.editorState.textContent,
          textContentRows: string[] = textContent.split('\n'),
          html: string = '',
          numOfRows: number = textContentRows.length

      textContentRows.forEach((textContentRow, row) => {
        let newLineHTML = row !== numOfRows - 1 ? '<br class="' + EditorClass.EDITOR_NEWLINE + '" data-lighditor-type="newline">' : ''
        html += '<div class="' + EditorClass.EDITOR_ROW + '" data-lighditor-type="row">' + textContentRow + newLineHTML + '</div>'
        // html += '<div class="' + EditorClass.EDITOR_ROW + '" data-lighditor-type="row">' + textContentRow + '</div>'
      })

      this.editorElement.innerHTML = html
    }

    // Attach the current selection/cursor
    this._applySelection()
  }

  _resetRender (): void {
    let defaultViewableRows = this.editorConfig.viewableRows

    this._setEditorState({
      textContent: '',
      selection: {
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 }
      },
      viewStartRow: 0,
      viewableRows: defaultViewableRows || Infinity
    })
  }

  _setEditorState (editorState: LighditorState): void {
    Lighditor.log('set editor state: ', editorState)

    let oldEditorState = this.editorState

    this.editorState = {
      ...editorState
    }

    this._render(!oldEditorState || this.editorState.textContent !== oldEditorState.textContent)
  }

  /***** Events *****/
  _listen (): void {
    this.editorElement.addEventListener('keydown', this._handleKeydown.bind(this))
    this.editorElement.addEventListener('keyup', this._handleKeyup.bind(this))
    // this.editorElement.addEventListener('paste', this._handlePaste.bind(this))
    this.editorElement.addEventListener('mouseup', this._handleMouseup.bind(this))
  }

  /**
   * Keydown event handler
   * Special key stroke will be handled here, so that we have full control
   * of the actually rendered DOM
   *
   * @param  {[type]} evt: KeyboardEvent [description]
   * @return {[type]}      [description]
   */
  _handleKeydown (evt: KeyboardEvent) {
    Lighditor.log('_handleKeydown:', evt)

    let cursorPosition: Position = this.getCursorPosition()

    if (Lighditor.util.getKeycode(evt) === Lighditor.util.keycode.ENTER) {
      // When hit enter key, we will simply update the selection and text content
      // with a newline character. The renderer will be able to pick up and render
      // the text content with clean format
      evt.preventDefault()

      // Update the selection state to the new line
      let newRow: number = cursorPosition.row + 1

      this.setSelection({
        start: {
          row: newRow,
          column: 0
        },
        end: {
          row: newRow,
          column: 0
        }
      })

      // Manually set text content
      this.setTextContent(this._insertTextAtPosition('\n', cursorPosition))
    }

    // Manually set text content
    if (Lighditor.util.getKeycode(evt) === Lighditor.util.keycode.BACKSPACE
      && this._isCaretSelection(this.getSelection())
      && cursorPosition.column === 0) {
      // When the selection is a cursor, and user hits backspace key at the
      // beginning of a row, Chrome will remove the new line element at the
      // previous row. Let's add it back
      evt.preventDefault()

      // Update the selection state to the prev line
      let newRow: number = Math.max(cursorPosition.row - 1, 0),
          rowElement = this._getRowElementByIndex(newRow),
          newColumn: number = (rowElement instanceof HTMLElement) ? rowElement.textContent.length : 0

      this.setSelection({
        start: {
          row: newRow,
          column: newColumn
        },
        end: {
          row: newRow,
          column: newColumn
        }
      })

      this.setTextContent(this._removeTextAtPosition(cursorPosition))
    }
  }

  _handleKeyup (evt: KeyboardEvent) {
    // let textContent: string = this._compileTextContent()
    if (Lighditor.util.getKeycode(evt) === Lighditor.util.keycode.ENTER) {
      evt.preventDefault()
      return
    }

    // // TODO: update selection if arrow key is up
    this._updateSelection()

    this.setTextContent(this._compileTextContent())
  }

  _handleMouseup (evt: MouseEvent) {
    this._updateSelection()
  }

  /***** Lifecycle *****/
  // There are four major lifecycles for a set of content in Lighditor. Lighditor will process the content
  // by chunks defined by user, so that the four phases can happen in parallel.
  //
  // Some keywords:
  // chunk: a string chunk to be parsed/rendered as a whole, which will passing the following lifecycles. A chunk contains config
  //        information, as well as the body of text content to be rendered
  // set: a string set contains one or multiple chunks, and can be understood by parser to give highlights, autocompletes, etc
  //
  // Compile phase
  // - Get the dirty HTML from browser after user interaction
  // - Compile the HTML into chunks of formatted content strings, including all information needed for render
  // - Passing the string chunks into rendering queue
  // - Notify rendering queue if the previous string chunks is a complete set of content to parse
  // - Notify rendering queue that compilation finishes and no more formatted string to render
  //
  // Queue phase
  // - The content string can be stored as chunks for rendering early access
  // - Some queue keywords for singalling. For example 'SET_COMPLETE' for a EOF set signal.
  // - Some queue management, for example promote some chunks by priority for rendering management
  //
  // Render phase
  // - Read from the rendering queue for formatted string chunks to renderer
  // - Render the string chunk with default plain text parser on screen
  // - The rendered result will be formatted HTML
  //
  // Parse phase
  // - Parser will be required from comsumer of Lighditor or using the default one (plain text)
  // - Parser is watching the renderer process. When it sees a signal for a set content in queue, it will start parsing
  // - Whenever a parsed result is produced, it will be send to rendering queue in some proper priority


  /**
   * Called after text content is changed
   */
  onTextContentChange (newTextContent: string, oldTextContent: string): void {}

  /**
   * Called after selection is changed
   */
  onSelectionChange (newSelection: Selection, oldSelection: Selection): void {}


  /***** Compile phase *****/
  _dfsTraverseNode (callback: (node: Node, row: number, column: number) => ?boolean): void {
    let nodeStack = [this.editorElement],
        row: number = -1,
        column: number = 0,
        node: ?Node
        // When there are <br> element in row, we need to add extra row
        // extraRowCount: number = 0

    while (node = nodeStack.pop()) {
      // /** Fix for firefox */
      // if (this._isBRElement(node)) {
      //   extraRowCount++
      //   row++
      //   column = 0
      // }
      // /** Fix for firefox end */

      if (this._isRowNode(node)) {
        row = this._getRowIndex(node)
        column = 0
      }

      if (callback(node, row, column)) {
        break
      }

      if (node instanceof Text) {
        column += node.length
      }

      if (node.childNodes && node.childNodes.length) {
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
    let contents: string = '',
        newlineQueue: string[] = []

    this._dfsTraverseNode((node: Node) => {
      if (node instanceof Text) {
        contents += node.textContent
      }

      if (this._isRowNode(node)) {
        contents += newlineQueue.pop() || ''
        newlineQueue.push('\n')
      }

    })

    return contents
  }

  _insertTextAtPosition (text: string, position: Position): string {
    let positionCharIndex = this._getCharIndexByPosition(position),
        prevTextContent: string = this.getTextContent().slice(0, positionCharIndex),
        afterTextContent: string = this.getTextContent().slice(positionCharIndex)

    return prevTextContent + text + afterTextContent
  }

  _removeTextAtPosition (position: Position, direction: ?string = 'left'): string {
    let positionCharIndex = this._getCharIndexByPosition(position),
        prevTextContent: string = direction === 'left' ? this.getTextContent().slice(0, positionCharIndex - 1) : this.getTextContent().slice(0, positionCharIndex),
        afterTextContent: string = direction === 'left' ? this.getTextContent().slice(positionCharIndex) : this.getTextContent().slice(positionCharIndex + 1)

    return prevTextContent + afterTextContent
  }

  _removeTextInSelection (selection: Selection): string {
    let startPositionCharIndex: number = this._getCharIndexByPosition(selection.start),
        endPositionCharIndex: number = this._getCharIndexByPosition(selection.end),
        prevTextContent: string = this.getTextContent().slice(0, startPositionCharIndex),
        afterTextContent: string = this.getTextContent().slice(endPositionCharIndex)

    return prevTextContent + afterTextContent
  }

  _getCharIndexByPosition (position: Position): number {
    let row = position.row,
        charCount = 0

    for (; --row >= 0;) {
      charCount += this._getTextContentByRow(row).length + 1
    }

    return charCount + position.column
  }

  _getTextContentByRow (row: number): string {
    let rowNodes = this.editorElement.childNodes,
        rowNode: ?Node = rowNodes[row]

    if (rowNode) {
      return rowNode.textContent
    } else {
      Lighditor.warn('Try to get row that not exist', row)
      return ''
    }
  }

  /**
   * Keep goes up and get the row node from current node.
   * Also calculate the row for given node
   */
  _getRowInfo (node: Node): ?RowInfo {
    let currentNode = node

    while (currentNode && currentNode !== this.editorElement) {
      if (this._isRowNode(currentNode)) {
        // Found nearest row container
        let rowCount = 0
        let n = currentNode
        for (; (n = n.previousSibling); rowCount++) {}

        return {
          container: currentNode,
          row: rowCount
        }
      }

      currentNode = currentNode.parentElement
    }

    return null
  }

  /**
   * Get the row index of given node
   */
  _getRowIndex (node: Node): number {
    let rowNode: ?RowInfo = this._getRowInfo(node)
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

  /**
   * Return true if the given node should be represented as a single row
   */
  _isRowNode (node: Node): boolean {
    // return node.parentElement === this.editorElement
    if (node instanceof HTMLElement) {
      return node.dataset && node.dataset['lighditorType'] === 'row'
    } else {
      return false
    }
  }

  _isBRElement (node: Node): boolean {
    // TODO: FLOW cannot reslove HTMLBRElement!
    // return node instanceof HTMLBRElement
    return node.nodeName === 'BR'
  }

  _isNewLineElement (node: Node): boolean {
    // return this._isBRElement(node) || this._isRowNode(node)
    // return this._isRowNode(node)
    if (node instanceof HTMLElement) {
      return node.dataset && node.dataset['lighditorType'] === 'newline'
    } else {
      return false
    }
  }

  _isCaretSelection (selection: Selection): boolean {
    return selection
      && selection.start.row === selection.end.row
      && selection.start.column === selection.end.column
  }

  /***** Queue phase *****/

  /***** Render phase *****/

  /***** Parse phase *****/

  /***** Editor utils *****/

  /***** Cursor and selection *****/
  _getSelectionNodePosition (positionType: PositionTypeEnum): ?Position {
    if (featureGetSelection && featureCreateRange) {
      let currentSelection = window.getSelection()
      let node: HTMLElement | Text

      switch (positionType) {
        case 'START':
          node = currentSelection.anchorNode
          // if (!(node instanceof Text)) {
          //   node = node.childNodes[currentSelection.anchorOffset]
          // }
          break;

        case 'END':
          node = currentSelection.focusNode
          // if (!(node instanceof Text)) {
          //   node = node.childNodes[currentSelection.focusOffset]
          // }
          break;

        default:
          node = currentSelection.focusNode
          // if (!(node instanceof Text)) {
          //   node = node.childNodes[currentSelection.focusOffset]
          // }
      }

      if (!node) {
        return null
      }

      let rowInfo: ?RowInfo = this._getRowInfo(node)

      if (!rowInfo) {
        return null
      }

      let rangeBeforeNodeInRow = document.createRange()
      rangeBeforeNodeInRow.selectNodeContents(rowInfo.container)
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

  _getTextContentByOffset (container: Node, offset: number): string {
    let textContent: string = ''

    if (!(container instanceof Text)) {
      for (let i = 0; i < offset; i++) {
        textContent += container.childNodes[i].textContent
      }
    } else {
      textContent = container.textContent.slice(0, offset)
    }

    return textContent
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

        let rangeStartColumn: number,
            rangeEndColumn: number,
            range = currentSelection.getRangeAt(0)

        // Find the text content length for range start and end offset
        let rangeStartOffset: number = this._getTextContentByOffset(range.startContainer, range.startOffset).length,
            rangeEndOffset: number = this._getTextContentByOffset(range.endContainer, range.endOffset).length

        if (this._isRangeReversed({
              start: selectionStartPosition,
              end: selectionEndPosition
            })) {
          rangeStartColumn = rangeEndOffset
          rangeEndColumn = rangeStartOffset
        } else {
          rangeStartColumn = rangeStartOffset
          rangeEndColumn = rangeEndOffset
        }

        this.setSelection({
          start: {
            row: selectionStartPosition.row,
            column: selectionStartPosition.column + rangeStartColumn
          },
          end: {
            row: selectionEndPosition.row,
            column: selectionEndPosition.column + rangeEndColumn
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
  _applySelection (): void {
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
}

window.Lighditor = Lighditor
