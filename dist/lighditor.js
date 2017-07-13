/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!********************************!*\
  !*** multi ./src/lighditor.js ***!
  \********************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/ryan/dev/lighditor/src/lighditor.js */1);


/***/ }),
/* 1 */
/*!**************************!*\
  !*** ./src/lighditor.js ***!
  \**************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

// Web editor should support
// 1. Basic type in editor
// 2. Get/Set cursor position
// 3. Get/Set selection
// 4. Get/Set text content
// 5.
//

var _lighditor = __webpack_require__(/*! ./lighditor.scss */ 2);

var _lighditor2 = _interopRequireDefault(_lighditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*:: type Position = {
  row: number,
  column: number
}*/
/*:: type Selection = {
  start: Position,
  end: Position
}*/
/*:: type LighditorConfig = {
  initTextContent: string
}*/
/*:: type LighditorProps = {
  element: HTMLElement,
  config: ?LighditorConfig
}*/
/*:: type LighditorState = {
  textContent: string,
  cursorPosition: Position,
  selection: {
    start: Position,
    end: Position
  }
}*/
/*:: type RowInfo = {
  element: HTMLElement | Text,
  row: number
}*/


var EditorClass = {
  CONTAINER: 'lighditorContainer',
  ELEMENT: 'lighditorRawElement',
  EDITOR_ELEMENT: 'lighditorElement',
  EDITOR_ROW: 'lighditorRow'
};

var positionTypeEnum = {
  START: 'start',
  END: 'end'
};

// Feature detection
/*:: type PositionTypeEnum = $Keys<typeof positionTypeEnum>*/
var featureGetSelection = !!window.getSelection;
var featureCreateRange = !!document.createRange;

var lighditorUtil = {

  throttle: function throttle(callback /*: () => mixed*/) {
    var interval /*: number*/ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var lastCalledTimestamp /*: ?number*/ = void 0,
        timeoutId = void 0;

    function refreshTimeout() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(function () {
        lastCalledTimestamp = null;
      }, interval);
    }

    function throttled() {
      if (!lastCalledTimestamp) {
        lastCalledTimestamp = Date.now();
        refreshTimeout();
        callback();
      }
    }

    return throttled;
  }

};

var Lighditor = function () {
  function Lighditor(element /*: HTMLElement*/, config /*: LighditorConfig*/) {
    var _this = this;

    _classCallCheck(this, Lighditor);

    this.element = element;
    this.editorConfig = config;

    // Error checks
    if (typeof this.element === 'undefined') {
      throw new Error('Missing element for editor');
    }

    // Build the editor DOM
    this._build();

    // Reset editor state
    this._resetRender();

    // Attach listeners
    this._listen();

    // Setup placeholder or init text
    this.setTextContent(this.editorConfig.initTextContent);

    // For debugging
    Lighditor.debug(function () {
      window.lighditor = _this;
    });

    // this.resetRender()
    // this.build()
    // this.listen()
    // @attachListeners()
    //

    // Decorate prototype
    // this.render = lighditorUtil.debounce(this.render.bind(this))
  }

  // Create a instance of Lighditor class


  _createClass(Lighditor, [{
    key: 'setTextContent',


    /***** Setters *****/
    value: function setTextContent(textContent /*: string*/) /*: void*/ {
      var oldTextContent = this.editorState.textContent;

      if (textContent === oldTextContent) {
        return;
      }

      this._setEditorState(_extends({}, this.editorState, {
        textContent: textContent
      }));

      this.onTextContentChange(textContent, oldTextContent);
    }
  }, {
    key: 'setSelection',
    value: function setSelection(selection /*: Selection*/) /*: void*/ {
      var oldSelection = this.editorState.selection;

      this._setEditorState(_extends({}, this.editorState, {
        selection: selection
      }), true);

      this.onSelectionChange(selection, oldSelection);
    }

    /***** Getters *****/

  }, {
    key: 'getSelection',
    value: function getSelection() /*: Selection*/ {
      return this.editorState.selection;
    }
  }, {
    key: 'getTextContent',
    value: function getTextContent() /*: string*/ {
      return this.editorState.textContent;
    }
  }, {
    key: 'getCursorPosition',
    value: function getCursorPosition() /*: Position*/ {
      return this.getSelection().end;
    }

    /***** Build and unbuild *****/

  }, {
    key: '_build',
    value: function _build() /*: void*/ {
      var elementParent = this.element.parentElement;
      if (!elementParent) {
        throw new Error('Element set to html document is not supported');
      }

      var wrapperElement /*: HTMLDivElement*/ = document.createElement('div');
      wrapperElement.classList.add(EditorClass.CONTAINER);

      // Replace with input element
      elementParent.replaceChild(wrapperElement, this.element);
      this.element.classList.add(EditorClass.ELEMENT);

      // Make sure the original element is not shown
      this.element.style.display = 'none';
      wrapperElement.appendChild(this.element);

      // Create editor
      this.editorElement = document.createElement('div');
      this.editorElement.classList.add(EditorClass.EDITOR_ELEMENT);

      // Make editor element editable
      this.editorElement.setAttribute('contenteditable', 'true');
      wrapperElement.appendChild(this.editorElement);
    }
  }, {
    key: '_destroy',
    value: function _destroy() /*: boolean*/ {
      this._resetRender();
      var wrapperElement = this.editorElement.parentElement,
          elementParent /*: Element*/ = void 0;

      if (!(wrapperElement instanceof HTMLElement)) {
        Lighditor.warn('The wrapper of editor is not an HTMLElement, which should not happen');
      }

      if (wrapperElement && wrapperElement.parentElement instanceof Element) {
        elementParent = wrapperElement.parentElement;
        elementParent.replaceChild(wrapperElement, this.element);
      }

      return delete this.editorElement;
    }

    /***** render and state *****/
    /**
     * Render the editor element inner html based on current editor state
     */

  }, {
    key: '_render',
    value: function _render() /*: void*/ {
      // Render the text content
      var textContent /*: string*/ = this.editorState.textContent;
      var textContentRows /*: string[]*/ = textContent.split('\n');
      var html /*: string*/ = '';

      textContentRows.forEach(function (textContentRow) {
        html += '<div class="' + EditorClass.EDITOR_ROW + '" data-lighditor-type="row">' + textContentRow + '</div>';
      });

      this.editorElement.innerHTML = html;

      // Attach the current selection/cursor
      this._restoreSelection();
    }
  }, {
    key: '_resetRender',
    value: function _resetRender() /*: void*/ {
      this._setEditorState({
        textContent: '',
        cursorPosition: { row: 0, column: 0 },
        selection: {
          start: { row: 0, column: 0 },
          end: { row: 0, column: 0 }
        }
      });
    }
  }, {
    key: '_setEditorState',
    value: function _setEditorState(editorState /*: LighditorState*/) /*: void*/ {
      var silence /*: boolean*/ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      Lighditor.log((silence ? 'silently ' : '') + 'set editor state: ', editorState);

      this.editorState = _extends({}, editorState);

      // When we set editor state, we need to re-render the content
      // based on given parser
      // TODO: Considering use virtual dom to render editor
      if (!silence) {
        this._render();
      }
    }

    /***** Events *****/

  }, {
    key: '_listen',
    value: function _listen() /*: void*/ {
      this.editorElement.addEventListener('keydown', this._handleKeydown.bind(this));
      this.editorElement.addEventListener('keyup', this._handleKeyup.bind(this));
      this.editorElement.addEventListener('mouseup', this._handleMouseup.bind(this));
    }
  }, {
    key: '_handleKeydown',
    value: function _handleKeydown(evt /*: KeyboardEvent*/) {}
  }, {
    key: '_handleKeyup',
    value: function _handleKeyup(evt /*: KeyboardEvent*/) {
      var textContent /*: string*/ = this._compileTextContent();

      // TODO: update selection if arrow key is up
      this._updateSelection();

      // TODO: We may not need to update the whole editor text content
      // but only the section that is actually changed
      // this.saveSelection()
      this.setTextContent(textContent);
      // this._restoreSelection()
    }
  }, {
    key: '_handleMouseup',
    value: function _handleMouseup(evt /*: MouseEvent*/) {
      this._updateSelection();
    }

    /***** Lifecycle *****/
    /**
     * Called after text content is changed
     */

  }, {
    key: 'onTextContentChange',
    value: function onTextContentChange(newTextContent /*: string*/, oldTextContent /*: string*/) /*: void*/ {}

    /**
     * Called after selection is changed
     */

  }, {
    key: 'onSelectionChange',
    value: function onSelectionChange(newSelection /*: Selection*/, oldSelection /*: Selection*/) /*: void*/ {}

    /***** Text content *****/

  }, {
    key: '_dfsTraverseNode',
    value: function _dfsTraverseNode(callback /*: (node: Node, row: number, column: number) => ?boolean*/) /*: void*/ {
      var nodeStack = [this.editorElement],
          row /*: number*/ = 0,
          column /*: number*/ = 0,
          node /*: ?Node*/ = void 0,

      // When there are <br> element in row, we need to add extra row
      extraRowCount /*: number*/ = 0;

      while (node = nodeStack.pop()) {
        if (this._isRowElement(node)) {
          row = this._getRowIndex(node) + extraRowCount;
          column = 0;
        }

        /** Fix for firefox */
        if (this._isBrElement(node)) {
          extraRowCount++;
          row++;
          column = 0;
        }
        /** Fix for firefox end */

        if (callback(node, row, column)) {
          break;
        }

        if (node instanceof Text) {
          column += node.length;
        }

        if (!this._isRowEmpty(node) && node.childNodes && node.childNodes.length) {
          var childNodes = node.childNodes;
          var childIndex /*: number*/ = childNodes.length;

          while (childIndex--) {
            nodeStack.push(childNodes[childIndex]);
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

  }, {
    key: '_compileTextContent',
    value: function _compileTextContent() /*: string*/ {
      var _this2 = this;

      var contents /*: Array<string[]>*/ = [];

      this._dfsTraverseNode(function (node /*: Node*/, row /*: number*/, column /*: number*/) {
        console.log('Traverse node', node, row, column);

        if (_this2._isRowElement(node) || _this2._isBrElement(node)) {
          // Warn if current row has content already. By DFS we are guaranteed
          // the row element is ran againast with first
          if (typeof contents[row] !== 'undefined') {
            Lighditor.warn('Row ' + row + ' has rendered');
          }

          // Make sure each row has a new line
          contents[row] = [];
        }

        if (node instanceof Text) {
          var rowContent = contents[row];

          /** Error checks **/

          // Warn if we have empty positions
          if (column > 0 && typeof rowContent[column - 1] === 'undefined') {
            console.warn('Row ' + row + ' has unassigned character at column ' + (column - 1));
            // Need to make up all unassigned position with space key
            var col = column;
            while (typeof rowContent[col - 1] === 'undefined') {
              rowContent[col - 1] = ' ';
              col--;
            }

            // TODO: Should we return true and stop traversal?
          }

          // Warn if we already have character at column position
          if (rowContent.length > column) {
            console.error('Row ' + row + ' has exist character at column ' + column);
            return true;
          }

          /** Error checks end **/

          // Copy nodeText to row content
          var nodeText = node.textContent;
          for (var i = column; i < nodeText.length; i++) {
            rowContent[i] = nodeText[i - column];
          }
        }
      });

      console.log('content: ', contents.map(function (rowArray) {
        return rowArray.join('\n');
      }));
      console.log('------------------ Traverse node finished ------------------');

      return contents.map(function (rowArray) {
        return rowArray.join('');
      }).join('\n');
    }

    /**
     * Recursively goes up and get the row node from current node
     */

  }, {
    key: '_getParentRowNode',
    value: function _getParentRowNode(node /*: Node*/) /*: ?RowInfo*/ {
      var runningNode = node;

      while (runningNode && runningNode !== this.editorElement) {
        if ((runningNode instanceof HTMLElement || runningNode instanceof Text) && runningNode.parentElement === this.editorElement) {
          var rowCount = 0;
          var n = runningNode;
          for (; n = n.previousSibling; rowCount++) {}

          return {
            element: runningNode,
            row: rowCount
          };
        }

        runningNode = runningNode.parentElement;
      }

      return null;
    }
  }, {
    key: '_getRowIndex',
    value: function _getRowIndex(node /*: Node*/) /*: number*/ {
      var rowNode /*: ?RowInfo*/ = this._getParentRowNode(node);
      if (!rowNode) {
        return -1;
      } else {
        return rowNode.row;
      }
    }
  }, {
    key: '_getRowElementByIndex',
    value: function _getRowElementByIndex(row /*: number*/) /*: ?HTMLElement | ?Text*/ {
      var node = this.editorElement.childNodes[row];
      if (node instanceof HTMLElement || node instanceof Text) {
        return node;
      } else {
        return null;
      }
    }
  }, {
    key: '_isRowElement',
    value: function _isRowElement(node /*: Node*/) /*: boolean*/ {
      return node.parentElement === this.editorElement;
    }
  }, {
    key: '_isBrElement',
    value: function _isBrElement(node /*: Node*/) /*: boolean*/ {
      // TODO: FLOW cannot reslove HTMLBRElement!
      // return node instanceof HTMLBRElement
      return node.nodeName === 'BR';
    }
  }, {
    key: '_isRowEmpty',
    value: function _isRowEmpty(node /*: Node*/) /*: boolean*/ {
      var rowInfo /*: ?RowInfo*/ = this._getParentRowNode(node);
      if (rowInfo) {
        // let childNodes = rowInfo.element.childNodes

        // childNodes

        // return childNodes && childNodes.length === 1 && this._isBrElement(childNodes[0])
        return rowInfo.element.textContent === '';
      } else {
        return false;
      }
    }

    /***** Cursor and selection *****/

  }, {
    key: '_getSelectionNodePosition',
    value: function _getSelectionNodePosition(positionType /*: PositionTypeEnum*/) /*: ?Position*/ {
      if (featureGetSelection && featureCreateRange) {
        var currentSelection = window.getSelection();
        var node /*: HTMLElement | Text*/ = void 0;

        switch (positionType) {
          case 'START':
            node = currentSelection.anchorNode;
            break;

          case 'END':
            node = currentSelection.focusNode;
            break;

          default:
            node = currentSelection.focusNode;
        }

        if (!node) {
          return null;
        }

        var rowInfo /*: ?RowInfo*/ = this._getParentRowNode(node);

        if (!rowInfo) {
          return null;
        }

        var rangeBeforeNodeInRow = document.createRange();
        rangeBeforeNodeInRow.selectNodeContents(rowInfo.element);
        rangeBeforeNodeInRow.setEnd(node, 0);

        return {
          row: rowInfo.row,
          column: rangeBeforeNodeInRow.toString().length
        };
      } else {
        // TODO: add support for old IE
        return null;
      }
    }

    /**
     * Get the current selection's start position
     */

  }, {
    key: '_getSelectionStartNodePosition',
    value: function _getSelectionStartNodePosition() /*: ?Position*/ {
      return this._getSelectionNodePosition('START');
    }

    /**
     * Get the current selection's end position
     */

  }, {
    key: '_getSelectionEndNodePosition',
    value: function _getSelectionEndNodePosition() /*: ?Position*/ {
      return this._getSelectionNodePosition('END');
    }

    /**
     * Return true if selection start is after end, as range always is from
     * start to end
     */

  }, {
    key: '_isRangeReversed',
    value: function _isRangeReversed(selection /*: Selection*/) /*: boolean*/ {
      return selection.start.row > selection.end.row || selection.start.column > selection.end.column;
    }

    /**
     * Update the selection state from user interaction
     */

  }, {
    key: '_updateSelection',
    value: function _updateSelection() /*: void*/ {
      if (featureGetSelection && featureCreateRange) {
        var currentSelection = window.getSelection();

        if (!currentSelection.focusNode || !currentSelection.anchorNode) {
          return;
        }

        var selectionStartPosition /*: ?Position*/ = this._getSelectionStartNodePosition(),
            selectionEndPosition /*: ?Position*/ = this._getSelectionEndNodePosition();

        if (selectionStartPosition && selectionEndPosition) {

          var rangeStart /*: Position*/ = void 0,
              rangeEnd /*: Position*/ = void 0,
              range = currentSelection.getRangeAt(0);

          if (this._isRangeReversed({
            start: selectionStartPosition,
            end: selectionEndPosition
          })) {
            rangeStart = range.endOffset;
            rangeEnd = range.startOffset;
          } else {
            rangeStart = range.startOffset;
            rangeEnd = range.endOffset;
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
          });
        }
      } else {
        // TODO: add support for old IE
      }
    }

    // Restore the saved selection and cursor position
    // REF: https://stackoverflow.com/questions/13949059/persisting-the-changes-of-range-objects-after-selection-in-html

  }, {
    key: '_restoreSelection',
    value: function _restoreSelection() /*: void*/ {
      if (featureGetSelection && featureCreateRange) {
        var getRangeSide = function getRangeSide(node /*: Node*/, nodeStartColumn /*: number*/, sideColumn /*: number*/) {
          var side = null;
          var nodeCharLength /*: number*/ = 0;
          // if (node instanceof Text) {
          if (node instanceof Text) {
            nodeCharLength = node.length;
          }

          var nodeEndColumn = nodeStartColumn + nodeCharLength;

          if (sideColumn >= nodeStartColumn && sideColumn <= nodeEndColumn) {
            // Found the text node where side column inside node
            side = {
              node: node,
              offset: sideColumn - nodeStartColumn
            };
          }
          // }

          return side;
        };

        var _selection = this.editorState.selection;

        if (!_selection) {
          return;
        }

        var range = document.createRange(),
            rangeStart /*: Position*/ = void 0,
            rangeEnd /*: Position*/ = void 0;

        if (this._isRangeReversed(_selection)) {
          rangeStart = _selection.end;
          rangeEnd = _selection.start;
        } else {
          rangeStart = _selection.start;
          rangeEnd = _selection.end;
        }

        var rangeStartRowElement = this._getRowElementByIndex(rangeStart.row),
            rangeEndRowElement = this._getRowElementByIndex(rangeEnd.row),
            side1 = void 0,
            side2 = void 0;

        if (!rangeStartRowElement || !rangeEndRowElement) {
          return;
        }

        // Set the range to the current cursor position to start with
        range.setStart(rangeStartRowElement, 0);
        range.collapse(true);

        this._dfsTraverseNode(function (node /*: Node*/, row /*: number*/, column /*: number*/) {
          if (node.childNodes.length === 0) {

            if (!side1 && row === rangeStart.row) {
              side1 = getRangeSide(node, column, rangeStart.column);
              if (side1) {
                range.setStart(side1.node, side1.offset);
              }
            }

            if (!side2 && row === rangeEnd.row) {
              side2 = getRangeSide(node, column, rangeEnd.column);
              if (side2) {
                range.setEnd(side2.node, side2.offset);
              }
            }

            if (side1 && side2) {
              return true;
            }
          }
        });

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    /***** Utils *****/

  }], [{
    key: 'create',
    value: function create(element /*: HTMLElement*/, config /*: ?LighditorConfig*/) {
      var actualConfig /*: LighditorConfig*/ = {
        initTextContent: ''

        // make sure defaults in config
      };if (typeof config !== 'undefined') {
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            actualConfig[key] = config[key];
          }
        }
      }

      return new Lighditor(element, actualConfig);
    }
  }, {
    key: 'destroy',
    value: function destroy(editor /*: Lighditor*/) /*: boolean*/ {
      if (editor instanceof Lighditor) {
        return editor._destroy();
      } else {
        Lighditor.warn('Try desgroy non-Lighditor: ', editor);
        return true;
      }
    }
  }, {
    key: 'enableLog',
    value: function enableLog() {
      localStorage.setItem('lighditor.enableLog', 'true');
    }
  }, {
    key: 'disableLog',
    value: function disableLog() {
      localStorage.setItem('lighditor.enableLog', 'false');
    }
  }, {
    key: 'log',
    value: function log() {
      if (localStorage.getItem('lighditor.enableLog') === 'true') {
        console.log.apply(null, arguments);
      }
    }
  }, {
    key: 'warn',
    value: function warn() {
      if (localStorage.getItem('lighditor.enableLog') === 'true') {
        console.warn.apply(null, arguments);
      }
    }
  }, {
    key: 'enableDebug',
    value: function enableDebug() {
      localStorage.setItem('lighditor.enableDebug', 'true');
    }
  }, {
    key: 'disableDebug',
    value: function disableDebug() {
      localStorage.setItem('lighditor.enableDebug', 'false');
    }
  }, {
    key: 'debug',
    value: function debug(callback /*: () => mixed*/) {
      if (localStorage.getItem('lighditor.enableLog') === 'true') {
        callback();
      }
    }
  }]);

  return Lighditor;
}();

window.Lighditor = Lighditor;

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

/***/ }),
/* 2 */
/*!****************************!*\
  !*** ./src/lighditor.scss ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(/*! !../node_modules/css-loader!../node_modules/sass-loader/lib/loader.js!./lighditor.scss */ 3);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(/*! ../node_modules/style-loader/lib/addStyles.js */ 5)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/sass-loader/lib/loader.js!./lighditor.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/sass-loader/lib/loader.js!./lighditor.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 3 */
/*!***********************************************************************************************!*\
  !*** ./node_modules/css-loader!./node_modules/sass-loader/lib/loader.js!./src/lighditor.scss ***!
  \***********************************************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../node_modules/css-loader/lib/css-base.js */ 4)(undefined);
// imports


// module
exports.push([module.i, ".lighditorElement {\n  height: 200px;\n  outline: none;\n  border: 1px solid black;\n  overflow: auto; }\n  .lighditorElement .lighditorRow {\n    font-family: courier;\n    height: 14px;\n    line-height: 14px; }\n", ""]);

// exports


/***/ }),
/* 4 */
/*!*************************************************!*\
  !*** ./node_modules/css-loader/lib/css-base.js ***!
  \*************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 5 */
/*!****************************************************!*\
  !*** ./node_modules/style-loader/lib/addStyles.js ***!
  \****************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(/*! ./urls */ 6);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 6 */
/*!***********************************************!*\
  !*** ./node_modules/style-loader/lib/urls.js ***!
  \***********************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ })
/******/ ]);
//# sourceMappingURL=lighditor.js.map