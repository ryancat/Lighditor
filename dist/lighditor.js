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
/*!****************************!*\
  !*** multi ./src/index.js ***!
  \****************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/ryan/dev/lighditor/src/index.js */1);


/***/ }),
/* 1 */
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Web editor should support
// 1. Basic type in editor
// 2. Get/Set cursor position
// 3. Get/Set selection
// 4. Get/Set text content
// 5.
//

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


var EditorClass = {
  CONTAINER: 'lighditorContainer',
  ELEMENT: 'lighditorRawElement',
  EDITOR_ELEMENT: 'lighditorElement'
};

var positionTypeEnum = {
  START: 'start',
  END: 'end'
};

/*:: type PositionTypeEnum = $Keys<typeof positionTypeEnum>*/


var ERROR_POSITION /*: Position*/ = {
  row: -1,
  column: -1

  // Feature detection
};var featureGetSelection = !!window.getSelection;
var featureCreateRange = !!document.createRange;

var Lighditor = function () {
  function Lighditor(props /*: LighditorProps*/) {
    _classCallCheck(this, Lighditor);

    this.element = props.element;
    this.editorConfig = props.config || {
      initTextContent: ''

      // this.resetRender()
      // this.build()
      // this.listen()
      // @attachListeners()
      //

    };
  }

  _createClass(Lighditor, [{
    key: 'resetRender',
    value: function resetRender() /*: void*/ {
      this.setEditorState({
        textContent: '',
        cursorPosition: { row: 0, column: 0 },
        selection: {
          start: { row: 0, column: 0 },
          end: { row: 0, column: 0 }
        }
      });
    }
  }, {
    key: 'build',
    value: function build(config /*: ?LighditorConfig*/) {
      // Error checks
      if (typeof this.element === 'undefined') {
        throw new Error('Missing element for editor');
      }

      var elementParent = this.element.parentElement;
      if (!elementParent) {
        throw new Error('Element set to html document is not supported');
      }

      // Update config
      if (typeof config !== 'undefined') {
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            this.editorConfig[key] = config[key];
          }
        }
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

      // Reset editor state
      this.resetRender();

      // Attach listeners
      this.listen();

      // Setup placeholder or init text
      this.setTextContent(this.editorConfig.initTextContent || '');
    }
  }, {
    key: 'listen',
    value: function listen() /*: void*/ {
      this.editorElement.addEventListener('keydown', this.handleKeydown.bind(this));
      this.editorElement.addEventListener('keyup', this.handleKeyup.bind(this));
    }

    /***** Event handlers *****/

  }, {
    key: 'handleKeydown',
    value: function handleKeydown(evt /*: KeyboardEvent*/) {}
  }, {
    key: 'handleKeyup',
    value: function handleKeyup(evt /*: KeyboardEvent*/) {
      // TODO: We may not need to update the whole editor text content
      // but only the section that is actually changed
      // this.saveSelection()
      this.setTextContent(this.editorElement.textContent);
      // this.restoreSelection()

      // TODO: update selection if arrow key is up
    }
  }, {
    key: 'handleMouseup',
    value: function handleMouseup(evt /*: MouseEvent*/) {
      this.updateSelection();
    }

    /***** Lifecycle events *****/
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

    /***** Setters *****/

  }, {
    key: 'setEditorState',
    value: function setEditorState(editorState /*: LighditorState*/) /*: void*/ {
      console.log('calling setEditorState: ', editorState);

      this.editorState = _extends({}, editorState);
    }
  }, {
    key: 'setTextContent',
    value: function setTextContent(textContent /*: string*/) /*: void*/ {
      var oldTextContent = this.editorState.textContent;

      this.setEditorState(_extends({}, this.editorState, {
        textContent: textContent
      }));

      this.onTextContentChange(textContent, oldTextContent);
    }
  }, {
    key: 'setSelection',
    value: function setSelection(selection /*: Selection*/) /*: void*/ {
      var oldSelection = this.editorState.selection;

      this.setEditorState(_extends({}, this.editorState, {
        selection: selection
      }));

      this.onSelectionChange(selection, oldSelection);
    }

    /***** Cursor and selection *****/

  }, {
    key: 'getSelection',
    value: function getSelection() /*: Selection*/ {
      return this.editorState.selection;
    }

    /**
     * Recursively goes up and get the row node from current node
     */

  }, {
    key: '_getParentRowNode',
    value: function _getParentRowNode(node /*: HTMLElement*/) /*: ?HTMLElement*/ {
      var runningNode = node;

      while (runningNode && runningNode !== this.editorElement && !runningNode.dataset['lighditorType'] === 'row') {
        runningNode = runningNode.parentElement;
      }

      if (runningNode && runningNode instanceof HTMLElement) {
        return runningNode;
      } else {
        return null;
      }
    }
  }, {
    key: '_getSelectionNodePosition',
    value: function _getSelectionNodePosition(positionType /*: PositionTypeEnum*/) /*: ?Position*/ {
      if (featureGetSelection && featureCreateRange) {
        var currentSelection = window.getSelection();
        var node /*: HTMLElement*/ = void 0;

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

        var rowNode = this._getParentRowNode(node);

        if (!rowNode) {
          return null;
        }

        var rangeBefore = document.createRange();
        rangeBefore.selectNodeContents(rowNode);
        rangeBefore.setEnd(node, 0);

        return {
          row: +rowNode.dataset['row'],
          column: rangeBefore.toString().length
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
     * Update the selection state from user interaction
     */

  }, {
    key: 'updateSelection',
    value: function updateSelection() /*: void*/ {
      if (featureGetSelection && featureCreateRange) {
        var currentSelection = window.getSelection();

        if (!currentSelection.focusNode) {
          return;
        }

        var range = currentSelection.getRangeAt(0);
        var selectionStartPosition /*: ?Position*/ = this._getSelectionStartNodePosition();
        var selectionEndPosition /*: ?Position*/ = this._getSelectionEndNodePosition();

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
          });
        }
      } else {}
      // TODO: add support for old IE


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
  }, {
    key: 'saveSelection',
    value: function saveSelection() /*: void*/ {}
  }, {
    key: 'restoreSelection',
    value: function restoreSelection(selection /*: Selection*/) /*: void*/ {}
  }, {
    key: 'getCursorPosition',
    value: function getCursorPosition() /*: Position*/ {
      var cursorPosition /*: Position*/ = { row: 0, column: 0 };

      return cursorPosition;
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

/***/ })
/******/ ]);
//# sourceMappingURL=lighditor.js.map