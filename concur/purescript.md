# PureScript & Concur

- [PureScript Book](https://book.purescript.org/)
- [PureScript Docs](https://github.com/purescript/documentation)
- [Concur](https://ajnsit.github.io/concur-documentation/ch00-00-introduction.html)
- [Pursuit](https://pursuit.purescript.org/)

## Widgets

Concur uses Widgets. You can create a widget using the `h1` function:

```purescript
helloWidget = h1 [className "heading"] [text "Hello Sailor!"]
```

The `h1` function takes an array of HTML properties and an array of HTML content, and returns a Widget:

> h1 :: [<props>] -> [<html-elements>] -> Widget

Most HTML tags have functions to construct widgets (`div, span, img` etc.)

A Widget is a new type that Concur defined:

> Widget HTML a

It's something that takes HTML (Array ReactElement) and returns any kind of type

Display widgets returns Void or Unit:

```purescript
helloWidget :: Widget HTML Unit
helloWidget = div' "Hello Sailor!"
main = runWidgetInDom "html-element-id" helloWidget
```

Unit usually indicates:
- Function returns nothing valuable
- Indicate a function can have a side effect

## Events

You can specify events you want to handle in a widget. E.g. handling the onClick event of a button

```purescript
hello = do
  widgetReturnValue <- "Hello" <$ button [onClick] [text "Say Hello"]
  text (widgetReturnValue <> " Sailor!")
```

Let's break it down:

`do`: Wait for something, then do something else. Like `await`, or `then`. Imagine something like:

```js
button("Say Hello").onClick().then(result => {
  text(`${result} Sailor!")
})
```

`<$`: Ignore the button return type, just return "Hello"
`widgetReturnValue <-` When the event occurs (onClick), put the return value in widgetReturnValue and continue the next function in the `do`
