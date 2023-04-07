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