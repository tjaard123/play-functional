# Functional programming

## Resources

- [Functional Programming; What? Why? When? - Robert C. Martin](https://www.youtube.com/watch?v=7Zlp9rKHGD4)
- [Value of Values - Rick Hickey](https://www.youtube.com/watch?v=-6BsiVyC1kM)
- [Power of Composition](https://www.youtube.com/watch?v=vDe-4o8Uwl8)
- [Purescript - main ideas (Great intro to FP)](https://www.youtube.com/watch?v=5AtyWgQ3vv0)
- [Haskell book](./haskell/haskellbook.pdf)
- [Category theory for beginners](https://www.youtube.com/playlist?list=PLCTMeyjMKRkoS699U0OJ3ymr3r01sI08l)
- [What's so great about FP anyway?](https://jrsinclair.com/articles/2022/whats-so-great-about-functional-programming-anyway/)
- [Beyond FP](https://youtu.be/832JF1o7Ck8)
- [John Carmac on FP](http://www.sevangelatos.com/john-carmack-on/)
- [JavaScript, the good parts](./js-the-good/slides-And-Then-There-Was-JavaScript.pdf)
- [Learn you a haskell for great good](http://learnyouahaskell.com/)
- [F# for fun and profit](http://http://fsharpforfunandprofit.com/)
- [Book code](https://bitbucket.org/syncfusion/fsharp-succinctly)
- [Category Theory - Bartosz Milewski](https://www.youtube.com/playlist?list=PLbgaMIhjbmEnaH_LTkxLI7FMa2HsnawM_)

## Functional basics

### Composition:

Think Lego. Each block is independent. Putting more than one block together, still makes it composable with other blocks. You can compose them in different ways.

Say we have three functions:

> fn1 >> fn2 >> fn3

Output of one function, is input to another. No special adapter needed, fn3 isn't attached to fn1 in someway. Each is independent.

There's a large corpus of knowledge on how to compose things, patterns, if you will, e.g.:

Monoid
- Composing lists, strings
Monad
- Composing functions with (side) Effects

This study is based on category theory (almost think, composition theory)

Functional programming is trying to compose smaller functions and types, to build something large, just like Lego.

### Types, not Classes

Forget what you know about Classes, FP uses types, and it's very different to a class.

A type is a way to name a set of similar things.

E.g. Int is all numbers, a Point is two Ints, a Person is a record of stuff. Functions can define the type (set) of things it can take as inputs and outputs.

When a function has the signature Int -> String, that is it's type. Any function that has the same signature, is within the same set of functions.

Using fn1's output type, it can be composed if fn2 has the same input type.

Types can be composed too. Aka algebriac data types. E.g. An Int OR a String (Discriminated union). A String AND a List (Tuple)

### Curry

But how do you compose one function that has two outputs, with another that only has one input?

Everyting would simply work better if all functions had one input. For this we need Curry & Partial application.

> fn (x, y) = fn(x) |> fn(y)

### Monad

>>= almost like a then?

