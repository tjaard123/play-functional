# Functional programming

This repo is my never-ending journey of learning functional, it's a **WORK IN PROGRESS**

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
- [SICP - The ultimate programming book](https://www.amazon.com/Structure-Interpretation-Computer-Programs-Engineering/dp/0262510871)

## Functional basics

### Purity

If the same input always produces the same output, a function is pure. If we can assume this for all functions, the compiler can help us a ton, and we can have much more confidence in our code. It's surprising how much safety a compiler can provide to our programs when we use a language who can guarantee this.

Basically, stop doing this:

```js
function pay (payment) {
  // Change the state

  // Change something in the environment
  savePaymentToDb(payment);

  return output;
}

// Some state

// Caller doesn't know everything the function will do
// Our input isn't the only thing the function uses
var o = doSomething(i);
// Our output is only the answer, nothing more
// We have to test the output for scenarios, if we want...
```

The compiler can't help you buddy, you'll see the error at runtime.

Start doing this:

```js
function doSomething (everythingItNeeds) {
  return everythingThatChanged;
}

// Caller has to provide everything the function needs
var o = doSomething(a);
// Caller has to deal with every possible scenario
```

The compiler can force you to deal with every scenario, you literally can't get it wrong, or forget.

We're limiting our functions, to not have side effects, and do unpredictable things. But in order to do this, input and output is your only tool. You want to log to the console, you can't, but you can return logs and let the caller decide. Want to get something from an API, fine, but your function signature must be clear that this will happen, and you have to handle all the possible output.

### Wrappers

The above was pretty basic, it's just the idea. The language to achieve the above concept has lots of tricks up it's sleeve.

Most importantly, we'll provide more input, and receive more output. We'll not only receive the answer of 2 plus 2, but also the logs, and we need to decide what to do with it. We will receive all scenarios as output, for example, maybe the value, or maybe an error.

Functions that return one single value, the answer, can't do this.

You need to wrap input and output in types. You'll return:

```js
{
  answer: 3,
  logs: "1 + 2 = 3"
}
```

Instead of just `3`. But returning a random answer for every function isn't all that useful.

### Algebraic Data Types

The key is to type your output into some pattern. For example a Maybe, something that is either a value, or nothing. Or type it to something that can be mapped over. Once you only use a few certain types, or patterns, your compiler gets super powers.

Algebraic data types are just types, that can be AND, or OR.

Or is like an enum, it can be this, or that, but not both.

And is just like an object, a record must have an age, and a name.

### Category Theory

This theory is super helpful as it has loads of well known types (Monads, Functors) etc.

Each of these types give you a benefit.

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

### Monadic

Monadic function: Function with a single argument

### Monad

A Monad is a pattern to compose functions which has side effects.

[Read more...](./docs/monads.md)

### Effects

Something that your program effects, the outside world interaction. This is implicitly controlled within functional languages.

For example, we read the window, get local storage and read a key. A stream of effects:

```purescript
-- Using do notation, more readable?
getTokenFromStorage' :: Effect (Maybe String)
getTokenFromStorage' = do
  w <- window
  s <- localStorage w
  getItem discordTokenKey s
```

But this is just the description, how do you... **run** it?

You need a **runtime**

- pure: `a -> Eff a` - Lift a value into an Effect
- map: `(a -> b) -> Eff a -> Eff b` - Use the value returned by Effect
- bind: `Eff a -> (a -> Eff b) -> Eff b` - Return new effect in order to run effects in sequence

Async bind is the way to get rid of callbacks

```purescript
example :: Aff _ (Array String)
example path = do
  files <- FS.readDir
  for files \file -> do
    FS.readFile file
```

Aff

### Random

Point free notation, leaving out the last argument, as it's passed automatically along the chain

```purescript
-- Point free form using >>= (bind)
getTokenFromStorage ∷ Effect (Maybe String)
getTokenFromStorage = window >>= localStorage >>= getItem discordTokenKey

-- Using do notation, more readable?
getTokenFromStorage' :: Effect (Maybe String)
getTokenFromStorage' = do
  w <- window
  s <- localStorage w
  getItem discordTokenKey s
```



