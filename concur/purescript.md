## Functional basics

- https://www.youtube.com/watch?v=vDe-4o8Uwl8

### Composition:

> fn1 >> fn2 >> fn3

Output of one function, is input to another. No special adapter needed, fn3 isn't attached to fn1 in someway. Each is independent.

Monoid
- Composing lists, strings
Monad
- Composing functions with (side) Effects

Based on category theory (composition theory)

### Types, not Classes

Name a set of things, e.g. Int is all numbers, a Point is two Ints, a Person is a record of stuff. Functions define the type (set) of things it inputs and outputs.

A function that turns Int -> String is a type of function. Any function that can do this, is part of the set.

Types can be composed too. Aka algebriac data types. E.g. An Int OR a String (Discriminated union). A String AND a List (Tuple)

### Curry

But how do you compose one function that has one output, with another that only has one input?

Everyting would simply work better if all functions had one input. For this we need Curry & Partial application.

> fn (x, y) = fn(x) |> fn(y)

### Monad

>>= almost like a then?

- [PureScript Book](https://book.purescript.org/)
- [PureScript Docs](https://github.com/purescript/documentation)
- [Concur](https://ajnsit.github.io/concur-documentation/ch00-00-introduction.html)
- [Pursuit](https://pursuit.purescript.org/)

Concur uses Widgets. A Widget is a new type defined by Concur:

> Widget HTML a

You can define new types like:

> newtype Point :: Point (Number, Number)


Display widgets returns Void or Unit:

```purescript
helloWidget :: Widget HTML Unit
helloWidget = div [text "Hello Sailor!"] []
main = runWidgetInDom "html-element-id" helloWidget
```

HTML is the view, and defined using the syntax `html-tag [properties] [content]`

```purescript
hello :: forall a. Widget HTML a
hello = do
  widgetReturnValue <- "Hello" <$ button [onClick] [text "Say Hello"]
  text (widgetReturnValue <> " Sailor!")
```


It has a view and a return type



Unit uses
- function returns nothing valuable (void)
- indicate a function has a side effect


```purescript
hello :: forall a. Widget HTML a
hello = do
  void $ button [onClick] [text "Say Hello"]
  text "Hello Sailor!"
```

```js
button("Say Hello").onClick().then() {
  text("Hello Sailor!")
}
```

`do` is just syntatic sugar, saying, wait for the first event, in this case a button click. Then pass that result to the second, in this case text.

Almost:

- do text(button())
- await text(await button())
- button().then(text)

`void` says thorw away the button result

```purescript
hello :: forall a. Widget HTML a
hello = do
  greeting <- div'
    [ "Hello" <$ button [onClick] [text "Say Hello"]
    , "Namaste" <$ button [onClick] [text "Say Namaste"]
    ]
  text (greeting <> " Sailor!")
```

so here, we'll execute the div function, which returns a view, two buttons.
when any of the buttons are clicked, the event triggers
do says, when the event is triggered, put the result into greeting, and pass that to the next function: text



# Routing

https://github.com/purescript-contrib/purescript-routing/blob/v8.0.0/GUIDE.md