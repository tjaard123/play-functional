# Functional Programming #

## What is it? ##

Functional programming is a simple premise that has far-reaching implications.
We construct our programs only using pure functions. In other words, functions
that contain no _side-effects_. What does this mean? Performing any of the
following would involve a side-effect:

*  Reassigning of a variable
*  Modifying a data structure in place
*  Setting a field on an object
*  Throwing an exception or halting with an error
*  Printing to the console or reading user input
*  Reading or writing to a file
*  Drawing to the screen

Try imagine how things would be like if we couldn't do any of the above? It
seems fairly impossible right now, but we can do all of the above (and even
more) without resorting to side-effects.

Functional programming is a restriction on *how* we write programs, but not
on *what* programs we write. Accepting this restriction is tremendously because
we immediately gain an increase to *modularity*. This modularity increase means
that pure functions are easier to test, to reuse, generalize and to reason
about.

## What is a (pure) function? ##

We are going to use Scala's syntax to represent functions, not because of any
bias, but because the syntax is clean and clear. A function, written as
`A => B` defines a computation that relates every value of type `A` to exactly
one value of type `B`.

For example, the function `intToString` has the type `Int => String` and will
take every single integer to a corresponding string. Furthermore, if it really
is a _function_, that is _all_ it will do.

Lets take an example, the addition (`+`) function on integers. This takes two
integers and always returns an integer value, the result of the addition.
Furthermore, applying this function to the same two integers, will _always reuslt
in the same integer_ as a result. The same is true for the `length` function
on a string. For a given string, the `length` will always be the same with
nothing else occuring.

## Referential Transparency ##

The fact that a pure function, given the same set of inputs, always produces
the same output is formalized into a concept called
_referential transparency_ (RT).

Take note: This is a property of expressions in general and not just of
functions.

Lets have a look at a concrete example that can support our discussion.
Consider any part of a program that can be evaluated to a result. For example,
`2 + 3` is and expression that applies the pure function `+` to the values `2`
and `3` (which are also expressions). Again, there is no side-effect and
the evaluation of the expression always results in the same value `5`, every
time. In fact, this means that you can replace any occurance of `2 + 3` in
your program with the value `5` and nothing about the program execution
would change.

A function is always _pure_, if its body is RT, assuming RT inputs.

## Referential Transparency in functional and non-functional ##

Referential transparency enables reasoning about your program evaluation called
_the substitution model_. Referentially transparent expressions enable what
is known as _equational reasoning_, where one replaces _equals for equals_.

In addition to now being able to reason about your programs, this kind of
process is extremely natural; you do it all the time, even in supposedly
"non-functional" languages (your friends `Java`, `C#`, `C`, ...).

Let's look at an two examples, in the one all expressions are RT and can be
reasoned about using the substitution model, the other contains some expressions
that violate RT.

```scala
scala> val x = "Hello, World"
x: java.lang.String = Hello, World

scala> val r1 = x.reverse
r1: String = dlroW ,olleH

scala> val r2 = x.reverse
r2: String = dlroW ,olleH
```

Now suppose we replace `x` with the expression referenced by `x`
(its definition):

```scala
scala> val r1 = "Hello, World".reverse
r1: String = dlroW ,olleH

scala> val r2 = "Hello, World".reverse
r2: String = dlroW ,olleH
```

No difference in the final results! Therefore, `x` is referentially transparent.
Furthermore, `r1` and `r2` are referentially transparent also.

Now for an expression that is not RT. In `Java`, an example of this is the
`java.lang.StringBuilder` class - similar classes exist in the .net world too.

```scala
scala> val x = new StringBuilder("Hello")
x: java.lang.StringBuilder = Hello

scala> val y = x.append(", World")
y: java.lang.StringBuilder = Hello, World

scala> val r1 = y.toString
r1: java.lang.String = Hello, World

scala> val r2 = x.toString
r2: java.lang.String = Hello, World
```

In the above, `x` and `y` are really the same reference and not RT. This makes
using equational reasoning extremely awkward as you need to evaluate the current
expression to determine what state the reference has. This is akin to
debugging your code and as it always is, is frustrating and tedious - especially
if you cannot reproduce some or other defect.

## Why functional programming? ##

It was eluded to that FP increases modularity in your programs. Why? This will
become more and more clear as we progress through the material, but we can
get some understanding of that fact right now.

Modular programs consist of small pieces (or components if we want to be
enterprise-y) that can be reused independant of the whole. Here, the whole
depends only on the meaning of the inidividual components and the rules
that govern their composition; that is, they are _composable_.

Composition is the process of combining small components / functions into bigger
and larger functions. Pure functions are composable because they separate the
function logic from "what to do with the result" and "how to obtain the
input". Input is via function arguments only and output is the final result of
the function. This separation makes the computation reusable. We can now use
this code wherever and whenever we want without worrying about side-effects
in the current context of computation.

This is an important point to note. Unfortunately, object-orientated (OO)
approaches are not fully reusable because they require an implicit state
that must be present for a method to operate as required. You can easily
debate this, but facts are facts and this is where OO starts to show
its flaws, of which there are many. Before
we conclude this digression (and you throw your arms in the air that I dared
to question the wonder that is OO), here is a quote from Joe Armstrong:

> I think the lack of reusability comes in object-oriented languages, not
> in functional languages. Because the problem with object-oriented languages
> is they've got all this implicit environment that they carry around with
> them. You wanted a banana but what you got was a gorilla holding the
> banana and the entire jungle.

John Carmack, the legend of id software and general `C++` guru, also has similar
comments where he says that writing functional code in `C++` is a massive
time saver due to the simplified interactions it provides. Please lookup
his timetime on twitter and [this](http://www.altdevblogaday.com/2012/04/26/functional-programming-in-c/).

Again, we can discuss this!

Another thing to note is that FP is *extremely* DRY. DRY stands for the
same principle as in OO programming, that being _do not repeat yourself_.
It is much preferred to abstract out patterns that you see instead of
repeating the same thing over and over. I would rather have one thing
which can work on a hundred object, instead of a hundred objects that can
do one thing.

## Factoring to functional ##

Right, lets look at some typical `Java` code. In the first listing, we have
the non-functional approach and in the second, we have the same program but
using a functional style.

### Non-functional ###

```java
// This has 2 members: 'name' and 'score' with getters
public class Player { ... }

// Now in some other code
public void printWinner(Player p) {
  System.out.println(p.getName() + " is the winner!");
}

public void declareWinner(Player p1, Player p2) {
    if (p1.score > p2.score) {
        printWinner(p1);
    } else {
        printWinner(p2);
    }
}
```

### Functional ###

```java
// This has 2 members: 'name' and 'score' with getters
public class Player { ... }

// Now in some other code
public void printWinner(Player p) {
    System.out.println(p.getName() + " is the winner!");
}

public Player winner(Player p1, Player p2) {
    return p1.score > p2.score ? p1 : p2;
}

public void declareWinner(Player p1, Player p2) {
    printWinner(winner(p1, p2))
}
```
