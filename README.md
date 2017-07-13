# Lighditor
#### A light weight and light fast web editor

### Demo
- [Basic support for plain text](https://codepen.io/ryancat/pen/mwzXdj)

### How to use

### Configuration

### New languages

### New parser

### Lifecycles
There are four major lifecycles for a set of content in Lighditor. Lighditor will process the content
by chunks defined by user, so that the four phases can happen in parallel.

**Some keywords:**
- chunk: a string chunk to be parsed/rendered as a whole, which will passing the following lifecycles. A chunk contains config
       information, as well as the body of text content to be rendered
- set: a string set contains one or multiple chunks, and can be understood by parser to give highlights, autocompletes, etc

#### Compile phase 
- Get the dirty HTML from browser after user interaction
- Compile the HTML into chunks of formatted content strings, including all information needed for render
- Passing the string chunks into rendering queue
- Notify rendering queue if the previous string chunks is a complete set of content to parse
- Notify rendering queue that compilation finishes and no more formatted string to render

#### Queue phase
- The content string can be stored as chunks for rendering early access
- Some queue keywords for singalling. For example 'SET_COMPLETE' for a EOF set signal.
- Some queue management, for example promote some chunks by priority for rendering management

#### Render phase 
- Read from the rendering queue for formatted string chunks to renderer
- Render the string chunk with default plain text parser on screen
- The rendered result will be formatted HTML

#### Parse phase
- Parser will be required from comsumer of Lighditor or using the default one (plain text)
- Parser is watching the renderer process. When it sees a signal for a set content in queue, it will start parsing
- Whenever a parsed result is produced, it will be send to rendering queue in some proper priority

### Caveat from development
- When editablecontent attribute turns on, different browser has different behavior in terms of adding and removing new line (hit enter key). 
  - Chrome:
    - When add new line, Chrome will clone the current line container and create a new line with the rest of text in the old line. If there is no rest strings, it will add one <br> in the row container. 
    - When remove all content from a line, Chrome will remove the current line content and change the current container to one <br> and one empty string.
    - When remove current line or multiple line, the removed lines will end up with a row containing one or two <br> if the after removed line is empty, or totally removed if it has contents.
  - Firefox:
    - When add new line, FF will enclose all new line in the old row container, and use <br> as indicator of new line
    - When remove lines, FF will only update the row container and remove <br> accordingly

### Help me make it better!

### MIT license
