# Purely functional state #

We now look at programs that can manipulate state in a purely functional way.
In order to do this we will be using something that is inherently incredibly
stateful in most programming languages, that being _random number generation_.

## Generating random numbers using side-effects ##

On the JVM, there is the class in the Java standard library that many people
use for random number generation, that being `java.util.Random`, which has a
pretty typical imperative API that relies on side-effects for the generation
of the next pseudo-random number in the sequence. Here are some examples
of its use from a Scala REPL:

```scala
scala> val rng = new java.util.Random
rng: java.util.Random = java.util.Random@caca6c9

scala> rng.nextDouble
res1: Double = 0.9867076608154569

scala> rng.nextDouble
res2: Double = 0.8455696498024141

scala> rng.nextInt
res3: Int = -623297295

scala> rng.nextInt
res4: Int = 1989531047
```

Now let's look at an extract of the API, transcribed to scala code:

```scala
trait Random {
  def nextInt: Int
  def nextBoolean: Boolean
  def nextDouble: Double
  ...
}
```

Without knowing the internal details of the class we can safely assume that
there is some implicit internal state that is being manipulated when any
of the methods on the `Random` trait are invoked. It should be obvious
that because the internal state changes with each method invocation, these
methods are not referentially transparent.

## Purely functional random number generation ##

The key to recovering referential transparency is to make the state updates
_explicit_. In other words, do not update the state as a side-effect, but instead
return the new state together with the generated value. A possible interface
could be:

```scala
trait RNG {
  def nextInt: (Int, RNG)
}
```

As you can see we are now not generating the value and mutating the state
in-place, but we return the value and the new state, leaving the old state
completely unmodified. This separates the _computing_ of the next state from
the concern of _propagating_ the state throughout the program. We are putting
the caller of `nextInt` in complete control with what to do with the new state.
Note that we are still _encapsulating_ the state, in the sense that users of this
API do not need to know anything about the inner workings of the random
number generator.

For completeness, the generator that we will reference is known as a
_linear congruential generator_.

```scala
object RNG {
def simple(seed: Long): RNG = new RNG {
  def nextInt = {
    val seed2 = (seed*0x5DEECE66DL + 0xBL) & ((1L << 48) - 1)
    ((seed2 >>> 16).asInstanceOf[Int], simple(seed2))
  }
}
```

The manner in which the state separation is made explicit is not only relevant
to random number generation, but it is frequently encountered and can be
dealt with in the same way, always.

Let's suppose that we have a simple class, defined as:

```scala
class Foo {
  var s: FooState = ...
  def bar: Bar
  def baz: Int
}
```

If `bar` and `baz` mutate `s` in some way, we can mechanically translate the
above class definition into a functional API:

```scala
trait Foo {
  def bar: (Bar, Foo)
  def baz: (Int, Foo)
}
```

What is important to understand is that the state propagation is being made
explicit. When this pattern is used, the users making use of the API need to
be responsible for threading through the state in their programs. If you
consider the RNG example, using the same RNG will always result in the same
value being generated. For example:

```scala
def randomPair(rng: RNG): (Int, Int) = {
  val (i1, _) = rng.nextInt
  val (i2, _) = rng.nextInt
  (i1, i2)
}
```

will result in `i1` being the same as `i2`! To correct this, the state needs
to be thread through the calls to `nextInt`:

```
def randomPair(rng: RNG): ((Int, Int), RNG) = {
  val (i1, rng2) = rng.nextInt
  val (i2, rng3) = rng2.nextInt
  ((i1, i2), rng3)
}
```

You can see the general pattern in the corrected function. Let's write some
functions and see if any other patterns jump out. Write a function to generate
a positive integer. You may use the `abs` function on `Int` to take the absolute
value of an integer. What corner cases are there? What about `Int.MinValue`?

```
def positiveInt(rng: RNG): (Int, RNG)
```

Write a function to generate a `Double` between 0 and 1, not including 1.

```
def double(rng: RNG): (Double, RNG)
```

Write functions to generate a `(Int, Double)` pair, a `(Double, Int)` pair
and a `(Double, Double, Double)` triple. You should be able to reuse
functions previously defined:

```
def intDouble(rng: RNG): ((Int, Double), RNG)
def doubleInt(rng: RNG): ((Double, Int), RNG)
def double3(rng: RNG): ((Double, Double, Double), RNG)
```

Now implement a function to generate a list of random integers.

```
def ints(count: Int)(rng: RNG): (List[Int], RNG)
```

## A better API for state actions ##

Examining the last few function implementations, we can see that there is a
common pattern: each of the functions has the form `RNG => (A, RNG)` for
some type `A`. Functions of this form describe _state actions_ that transform
`RNG` states. These functions can be built up and combined using
general-purpose functions.

Let's make the notation more convienient and create what is known as a
_type alias_. Type aliases are indistinguishable from their expanded forms
to the compiler, but improve the readability:

```
type Rand[+A] = RNG => (A, RNG)
```

We can now change the methods of the RNG into values of this type, for example:

```
val int: Rand[Int] = _.nextInt
```

We want to start writing combinators that let us avoid explicitly passing the
state around. This then becomes a kind of domain-specific language which does
all of this passing around for us. A simple RNG action is know as the `unit`
action, which passes the RNG state through without using it, always
returning a constant value instead of a random value.

```
def unit[A](a: A): Rand[A] =
  rng => (a, rng
```

There is also `map`, for transforming the output of a state action without
modifying the state itself.

```
def map[A, B](s: Rand[A])(f: A => B): Rand[B] =
  rng => {
    val (a, rng2) = s(rng)
    (f(a), rng2)
  }
```

Use the `map` function to generate an `Int` between 0 and n, inclusive:

```
def positiveMax(n: Int): Rand[Int]
```

Now implement `RNG.double` more elegantly using `map`.
Unfortunately, `map` is not powerful enough to implement the functions
`intDouble` and `doubleInt` from before, we need a new combinator, `map2`, that
can combine two RNG actions into one using a binary rather than unary
function. Implement `map2` and then use it to reimplement `intDouble` and
`doubleInt`.

```
def map2[A,B,C](ra: Rand[A], rb: Rand[B])(f: (A, B) => C): Rand[C]
```

Let's again look at `positiveInt` and see if we can implement it in terms
of `map`. We can achieve most of the implementation, but what happens in the
case of `Int.MinValue`? It doesn't have a positive counterpart and we cannot
generate an arbitrary number either:

```
def positiveInt: Rand[Int] =
  map(int) { i =>
    if (i != Int.MinValue) i.abs else ???
  }
```

We therefore need a combinator more powerful than `map`:

```
def flatMap[A, B](f: Rand[A])(g: A => Rand[B]): Rand[B]
```

Now re-implement `map` and `map2` in terms of `flatMap`. You should be
able to see that `map` does not care that it is dealing with RNG state actions
and as a result we can give it a more general signature:

```
def map[S,A,B](a: S => (S, A))(f: A => B): S => (B, S)
```

Changing the function definition does not change the implementation of `map`
at all. the more general signature was there all along, hidden from us until
we looked for it. We should come up with a more general type than `Rand`,
which can handle any type of state:

```
type State[S, +A] = S => (S, A)
```

`State` here is just a shorthand for "state action". It could also be written
as its own datastructure and not just a type alias:

```scala
case class State[S, +A](run: S => (S, A))
```

As an exercise, generalize the `map`, `map2`, `flatMap` and `sequence` operations
and add then to the state structure.

## Purely functional imperative programming ##

In the previous sections, the functions we wrote followed a very definite
pattern. We could run some state actions, assign the results to a `val`,
then run another state action and assign the result to a `val`. This method
looks a lot like _imperative_ programming.

In the imperative programming paradigm, a program is constituted by a series
of statements, where each statement can modify the program state. This is
exactly what we have been doing, except that our "statements" are really state
actions, which are really functions.

Let's consider the following example, assuming that we have made a `Rand[A]`
alias for `State[RNG, A]`:

```scala
int.flatMap(x =>
int.flatMap(y =>
ints(s).map(xs =>
xs.map(_ % y))))
```

Its not very clear about what exactly is going on here, but since we have
`map` and `flatMap` defined, we can use some Scala syntax to recover
this imperative style:

```
for {
  x <- int
  y <- int
  xs <- ints(x)
} yield xs.map(_ % y)
```

F# and Haskell also have the same kind of idea as Scala's for comprehensions,
respectively called "Computation Expressions" and `do`-notation. We will be
investigating these in later material, but just take note that this concept
has its foundation on the derivations that we have made in this section.
