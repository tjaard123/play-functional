# Sane error handling without exceptions.

## Introduction

Back in the first section, we spoke about referential transparency and how
exceptions break referential transparency. Let's look at an example:

```scala
def failingFn(i: Int): Int = {
  val x: Int = throw new Exception("fail!")
  try {
    val y = 42 + 5
    x + y
  } catch { case e: Exception => 43 }
}
```

Now, this code block presents a few problems. Firstly, this might look perfectly
natural to you, but can you reason about what will happen - not just in this
code but in the code that uses this function? The answer is: No.

This function no longer produces a value, instead the execution will jump to the
closest enclosing `catch` block, and that is completely dependent on the context
in which the function was used. Furthermore, if you replace `x` with the
expression, using the substitution model does not work:
```
throw new ArtithmeticExcpetion("fail!") + y
```

## Possible exception alternative

Let's consider a more realistic example of where an exception might be used:

```
mean :: [Double] -> Double
mean xs = if null xs
          then error "mean of empty list"
          else (sum xs) / (length xs)

def mean(xs: List[Double]): Double =
  if (xs.isEmpty)
    throw new ArithmeticException("mean of empty list")
  else
    xs.sum / xs.length
```

The function `mean` is what is termed a _partial function_: it is not
defined for some inputs. To make this function complete, there are a couple
of strategies that we could use, we could return some sort of bogus value,
an or possibly `null` - we could even return some "sentinel" value - but
we reject this solution for the following reasons:

* It allows for silent error propagation - the callee always needs to check
* It cannot be applied to polymorphic code. For some types we might not even
  have a sentinel value to use.
* This forces a special policy or calling convention for callers - callers
  of the `mean` function now need some additional knowledge of the workings
  of `mean`. This makes passing such a function to higher-order functions
  extremely difficult.

Another possibility is to force the user to provide some sort of value for
the error case:

```scala
mean_1 :: [Double] -> Double -> Double
mean_1 xs orEmpty = if null xs then orEmpty else (sum xs) / (length xs)

def mean_1(xs: List[Double], orEmpty: Double: Double) =
  if (xs.isEmpty) orEmpty else (xs.sum / xs.length)
```

This does make `mean_1` a total function but there are drawbacks - the caller
needs to have immediate knowledge of how to handle the undefined case and
additionally limits them to returning `Double`. Questions arise such as
what if `mean_1` is part of a larger computation and we like to know if
the mean is undefined? We need a way to defer the decision of how to handle
these cases so that they can be dealt with at the most appropriate level.

## The Option data type ##

The solution is to indicate explicitly in the return type that we may not have
a defined value. We can think of this as deferring to the caller for the error
handling strategy.

`Option` has two possible cases `Some x` and `None`. In `Haskell` the `Option`
data type is called `Maybe` with data constructors `Just x` and `Nothing`.

Let's look at the `mean` function again, using the `Option` data type:

```
mean :: [Double] -> Maybe Double
mean xs = if null xs then Nothing else Just ((sum xs) / (length xs))

def mean(xs: List[Double]): Option[Double] =
  if (xs.isEmpty) None
  else Some(xs.sum / xs.length)
```

The return type now indicates that the function may not always result in a value.

### Usage Patterns for Option / Maybe ###

Partial functions a fond all over the place in programming - often the libraries
we use, including the standard library in some cases. Some examples could be:

* Looking up a key in a map should return `Option`.
* `headOption` and `lastOption` when working with a sequence where the first
  or last elements are contained in the `Option` if they exist.

The benefit of using `Option` is that we can factor out many common usage
patterns of error handling into higher-order functions, which frees us from
writing "accepted" boilerplate.

Sometimes, the `Option` type is thought of as being a `List` that can contain
at most one element. Many of the functions we saw previously for the `List`
data type have analogous functions defined for `Option`.

Let's implement some of the most common funcitons for the `Option` type. All
of these functions can be implemented without resorting to pattern matching,
except for the functions `map` and `getOrElse`.

```
module MyOption where

  data MyOption a = Some a | None

  omap :: (a -> b) -> MyOption a -> MyOption b

  flatMap :: (a -> MyOption b) -> MyOption a -> MyOption b

  getOrElse :: a -> MyOption a -> a

  orElse :: MyOption a -> MyOption a -> MyOption a

  filterr :: (a -> Bool) -> MyOption a -> MyOption a
```

The `map` function allows us to apply a function to the contents of an
`Option`. In other words, `map` will apply a function if the computation
has not failed. Let's look at an example, imagine that you have an
associative map data structure that is associating an employee name to an
instance of `Employee`. The Map data structure is defined to return a
`Option[Employee]` as the result. I.e: the association between name and
employee may not exist. We can then chain computations onto the `Option`,
assuming that there was not any error and deferring the error handling
to where it is applicable.

```
omap getDepartment $ getFromMap "Eddie" employeeMap

val dept: Option[String] = employeeMap.get("Eddie").map(_.dept)
```

To further illustrate the use of `Option` where you would assume success right
up to the last possible point, have a look at the following code sample

```scala
val dept: String =
  employeesByName.get("Joe").
  map(_.dept).
  filter(_ != "Accounting").
  getOrElse("Default Dept")
```

Its a general rule that exceptions are not used throughout the code base,
except for errors that one cannot recover from at all. In some usages, the
error may be recoverable to the caller of the funciton - using an `Option` we
give the flexibility to make that decision to the caller, without being
dishonest with what the function can and cannot do.

## Option composition and lifting ##

It may be easy to jump to the conclusion that once you start using `Option`,
it infects our entire code base. One can imagine how any caller of a method
that returns an `Option` with have to handle either `Some` or the `None`.

This simply does not happen and the reason why is that we can lift any
normal function into the context on `Option`. In other words, we can promote
a normal function `A => B` into a function `Option[A] => Option[B]`. An
explicit type signature might make this more obvious:

```
lift :: (a -> b) -> (Option a -> Option b)
lift f = \x -> omap f x

def lift[A, B](f: A => B): Option[A] => Option[B] = _ map f
```

As an example of when you might want to use `map`, let's look at another example
of a function that returns an `Option`:

```
def pattern(s: String): Option[Pattern] =
  try {
    Some(Pattern.compile(s))
  } catch {
    case e: PatternSyntaxException => None
  }
```

This function uses the `Java` standard library's regex package to parse a
string into a regular expression pattern. To use the methods on `Pattern`,
they need not have any knowledge of `Option`. We can simply _lift_ them
using the `map` function:

```
def mkMatcher(pat: String): Option[String => Boolean] =
  pattern(pat) map (p => (s: String) => p.matcher(s).matches)
```

Here, `pattern(pat)` will return a `Option[Pattern]`, which will be `None`
if `pat` is not valid. Notice that we are using the `matcher` and
`matches` functions _inside_ the `map`.

As an exercise, lookup the `sequence` and `traverse` functions. We will be
introducing them in later content.

## The Either data type ##

Now, `Option` is a data structure that allows us to cleanly handle errors,
but it is rather simplisic. Notice that `Option` does not tell you why the
error has occured, although you can probably figure it out based on context.

In some cases, you would like something to represent the error, but also
tell you a little more about why the error happened in the first place. Perhaps
something like a `String` description?

We can craft a data type that encodes whatever information we want about
the failures. In cases where just knowing that a failure has occured is
sufficient we can use `Option`; other times we want more information.

This brings us to the `Either` data type which can contain the reason for a
failure.

```
data MyEither a b = Left a | Right b

sealed trait MyEither[+E, +A]
case class Left[+E](value: E) extends MyEither[E, Nothing]
case class Right[+A](value: A) extends MyEither[Nothing, A]
```

Either is just like option, it is the _disjoint union_ of two data constructors.
When we use `Either` to represent a failure or a success, the convention is
to have the failure represented by the `Left` data constructor. `Either` is
also used to encode the result of two possible outcomes.

Here is a simple example that illustrates the usage of `Either`, capturing
additional information for the error case:

```
def mean(xs: IndexedSeq[Double]): Either[String, Double] =
  if (xs.isEmpty)
    Left("mean of empty list!")
  else
    Right(xs.sum / xs.length)

mean :: [Double] -> Either String Double
mean xs = if null xs
          then Left "mean of empty list"
          else Right (sum xs / length xs)
```
