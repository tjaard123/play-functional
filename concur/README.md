# Galactica

PureScript-Concur, Npm, Spago, Google Closure Compiler, and Parcel. Builds tiny 180KB uncompressed bundles!

```sh
npm install
# Build PureScript, after this VS Code should auto build
npm run build
# Run dev server
npm start
```

## Hot code reload with purescript code

At the end of the previous command, you will have a development server which will watch for changes, and automatically reload the web page. This mechanism only works with JS changes.

However, in practice, your IDE should automatically recompile PureScript to Javascript on every change, which will be picked up by the development server. So you get immediate recompilation even with PureScript.

### Build production artifacts

> npm run prod

The artifacts are put into the `dist/` folder.
