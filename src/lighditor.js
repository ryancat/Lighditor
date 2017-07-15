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
    let textContent: string = this.editorState.textContent,
        textContentRows: string[] = textContent.split('\n'),
        html: string = '',
        numOfRows: number = textContentRows.length


    textContentRows.forEach((textContentRow, row) => {
      let newLineHTML = row !== numOfRows - 1 ? '<br class="' + EditorClass.EDITOR_NEWLINE + '">' : ''
      // let newLineHTML = ''
      html += '<div class="' + EditorClass.EDITOR_ROW + '" data-lighditor-type="row">' + textContentRow + newLineHTML + '</div>'
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
    Lighditor.log('_handleKeydown:', evt)
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
   * Traverse the raw dirty HTML in editor with DFS, which makes sure
   * we are traversing from the beginning to the end of lines
   */
  _dfsTraverseRawNode (callback: (node: Node) => ?boolean): void {
    let nodeStack = [this.editorElement],
        node: ?Node
        // When there are <br> element in row, we need to add extra row
        // extraRowCount: number = 0

    while (node = nodeStack.pop()) {

      if (callback(node)) {
        break
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
    let contents: string = ''

    this._dfsTraverseRawNode((node: Node) => {
      console.log('Traverse node', node)

      // if (this._isRowNode(node)) {
      //   // Warn if current row has content already. By DFS we are guaranteed
      //   // the row element is ran againast with first
      //   if (typeof contents[row] !== 'undefined') {
      //     Lighditor.warn('Row ' + row + ' has rendered')
      //   }

      //   // Make sure each row has a new line
      //   contents[row] = []
      // }

      if (node instanceof Text) {
        // let rowContent = contents[row]

        // /** Error checks **/

        // // Warn if we have empty positions
        // if (column > 0 && typeof rowContent[column - 1] === 'undefined') {
        //   console.warn('Row ' + row + ' has unassigned character at column ' + (column - 1))
        //   // Need to make up all unassigned position with space key
        //   let col = column
        //   while (typeof rowContent[col - 1] === 'undefined') {
        //     rowContent[col - 1] = ' '
        //     col--
        //   }

        //   // TODO: Should we return true and stop traversal?
        // }

        // // Warn if we already have character at column position
        // if (rowContent.length > column) {
        //   console.error('Row ' + row + ' has exist character at column ' + column)
        //   return true
        // }

        // /** Error checks end **/

        // // Copy nodeText to row content
        // let nodeText = node.textContent
        // for (let i = column; i < nodeText.length; i++) {
        //   rowContent[i] = nodeText[i - column]
        // }

        contents += node.textContent
      }

      if (this._isNewLineElement(node)) {
        contents += '\n'
      }

    })

    console.log('content: ', contents)
    console.log('------------------ Traverse node finished ------------------')

    // Try some crazy regexp way
    // let tempElement: HTMLElement = document.createElement('div')

    // tempElement.innerHTML = this.editorElement.innerHTML
    //   .replace(/<(div|p|br)[^<]*?>/g, '&lt;br /&gt;')
    //   .replace(/<([(i|a|b|u)^>]+)>(.*?)<\/\1>/gim,
    //     function(v) { return '' + window.escape(v) + ''; })

    // contents = tempElement.textContent

    // function extractTextWithWhitespace( elems ) {
    //     var ret = "", elem;

    //     for ( var i = 0; elems[i]; i++ ) {
    //         elem = elems[i];

    //         // Get the text from text nodes and CDATA nodes
    //         if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
    //             ret += elem.nodeValue + "\n";

    //         // Traverse everything else, except comment nodes
    //         } else if ( elem.nodeType !== 8 ) {
    //             ret += extractTextWithWhitespace( elem.childNodes );
    //         }
    //     }

    //     return ret;
    // }

    // contents = extractTextWithWhitespace([this.editorElement])

    // contents = this.editorElement.innerText

    // dirtyHTML = this.editorElement.innerHTML

    contents = this.editorElement.innerHTML
      .replace(/\<br/g, '\n')
      .replace(/\<[^>]*\>/g, '')
    return contents
  }

  // _compileTextContent (): string {
  //   let contents: string = ''

  //   this._dfsTraverseNode((node: Node, row: number, column: number) => {
  //     console.log('Traverse node', node, row, column)

  //     if (this._isRowNode(node) || this._isBRElement(node)) {
  //       // Warn if current row has content already. By DFS we are guaranteed
  //       // the row element is ran againast with first
  //       if (typeof contents[row] !== 'undefined') {
  //         Lighditor.warn('Row ' + row + ' has rendered')
  //       }

  //       // Make sure each row has a new line
  //       contents[row] = []
  //     }

  //     if (node instanceof Text) {
  //       let rowContent = contents[row]

  //       /** Error checks **/

  //       // Warn if we have empty positions
  //       if (column > 0 && typeof rowContent[column - 1] === 'undefined') {
  //         console.warn('Row ' + row + ' has unassigned character at column ' + (column - 1))
  //         // Need to make up all unassigned position with space key
  //         let col = column
  //         while (typeof rowContent[col - 1] === 'undefined') {
  //           rowContent[col - 1] = ' '
  //           col--
  //         }

  //         // TODO: Should we return true and stop traversal?
  //       }

  //       // Warn if we already have character at column position
  //       if (rowContent.length > column) {
  //         console.error('Row ' + row + ' has exist character at column ' + column)
  //         return true
  //       }

  //       /** Error checks end **/

  //       // Copy nodeText to row content
  //       let nodeText = node.textContent
  //       for (let i = column; i < nodeText.length; i++) {
  //         rowContent[i] = nodeText[i - column]
  //       }
  //     }
  //   })

  //   console.log('content: ', contents.map((rowArray) => { return rowArray.join('\n') }))
  //   console.log('------------------ Traverse node finished ------------------')

  //   return contents.map((rowArray) => { return rowArray.join('') }).join('\n')
  // }

  /**
   * Recursively goes up and get the row node from current node.
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
    return node.dataset && node.dataset['lighditorType'] === 'row'
  }

  _isBRElement (node: Node): boolean {
    // TODO: FLOW cannot reslove HTMLBRElement!
    // return node instanceof HTMLBRElement
    return node.nodeName === 'BR'
  }

  _isNewLineElement (node: Node): boolean {
    // return this._isBRElement(node) || this._isRowNode(node)
    return this._isRowNode(node)
  }

  /**
   * A new line row node is a node that has only <br>s
   */
  // _isNewLineRow (node: Node): boolean{
  //   let hasOnlyBrNode = false

  //   if (node.childNodes && node.childNodes.length) {

  //   }

  //   if (node.textContent === '' && )
  // }


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
