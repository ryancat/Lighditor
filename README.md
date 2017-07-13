# Lighditor
#### A light weight and light fast web editor

### Demo
- [Basic support for plain text](https://codepen.io/ryancat/pen/mwzXdj)

### How to use

### Configuration

### New languages

### New parser

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
