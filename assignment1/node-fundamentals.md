# Node.js Fundamentals

## What is Node.js?
Node.js is a package that allows for JavaScript scripts to access files and resources stored on a remote place easily.  

## How does Node.js differ from running JavaScript in the browser?
Node.js allows for file system access while native JacaScript does not.  

## What is the V8 engine, and how does Node use it?
The V8 engine is the interpreter used by Node to convert JavaScript into machine code.  

## What are some key use cases for Node.js?
Anything that requires access to server files like a Pokemon TCG storefront, which has to know the current stock of certain card packs.  

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
// CommonJS modules are only synchronous, meaning that code has to run in sequence. It also uses .exports and require() for importing and exporting.  
function add(a, b) {
    return a + b
}
module.exports = { add };

```

**ES Modules (supported in modern Node.js):**
```js
// ES Modules allows for removal of unused code and allows for asynchronous function calls. It uses import and export for importing and exporting modules.  
export function add(a, b) {
    return a + b
}
``` 