# Getting Started with FP

Previously, we had a look at why FP is something we should try understand.
In this section we will be building on what we have already learned, by
focusing in on something that is the core of FP - namely the function
itself.

## Recursion ##

Recursion is used to define an object in terms of itself. Please take note that
object used here is not the OO term, but instead the term as used in mathematics
where the object is anything that the category contains.

In normal imperative code, you have different tools at your disposal, like loops.
But we previously learned that FP does not have loops. Therefore, the only
way we can repeatedly do something is via `recursion` (as you have probably
guessed already). This need not be an expensive operation! Modern compilers
can perform something called Tail Call Optimization (TCO) where a nice
recursive definition can be replaced with a loop in the final machine code.
Furthermore, the compiler can perfrom TCO to create a structure that normally
the developer cannot (Yes, the compiler is smarter than what you are!)

That being said, the classical definition of recursion is probably for the
factorial function:

```scala
def factorial(n: Int) =
  if (n <= 0) 1 else n * factorial(n - 1)
```

The above function is sadly, not tail recursive. Why?

Here is another recursive function, one that is very often used in Haskell
literature:

```haskell
quicksort :: (Ord a) => [a] -> [a]
quicksort [] = []
quicksort (x:xs) =
    let smallerSorted = quicksort [a | a <- xs, a <= x]
        biggerSorted = quicksort [a | a <- xs, a > x]
    in  smallerSorted ++ [x] ++ biggerSorted
```


SIDEBAR: The correct version of the tail recursive factorial in Scala is:

```scala
def factorial(n: Int) = {
  def inner(acc: Int, n: Int): Int =
    if (n <= 0) acc else inner(n * acc, n - 1)

  inner(n)
}
```

### Exercises ###

Write the function to get the n-th Fibonacci number. The first two numbers in
the sequence are `0` and `1`, and the following numbers are always the sum of
the pervious two. You should use recursion to solve this, without blowing the
stack.

```scala
def fib(n: Int): Int
```

```haskell
fib :: (Num a) => a -> a
```


## Anonymous functions ##

Because functions get passed around often in functional programming, it is
convienient to have a lightweight syntax to declare a function, locally,
without needing to give it a name (hence anonymous).

Such function definitions are often also termed: _funciton literals_,
_lambda functions_, _lambda expressions_ or simply _lambdas_.
(The name lambda stems from the _lambda calculus_, another theoretical basis
for computation).

There is a plethoria of syntax for different languages, but lets just focus on
examples for three such languages (`Scala`, `F#` and `Haskell`)

```scala
(x: Int) => x * x
(x, Int, y: Int) => x + y
```

```fsharp
fun a -> a * a
fun a b -> a + b
```

```haskell
\x -> x * x
\x y -> x + y
```

## Polymorphic functions ##

All the functions we have seen so far are called _monomorphic functions_. That
is a function that operates only on one type of data. For example, `factorial`
is specific to integers. Because we like the DRY principle, we want to write
functions that are applicable to _any_ given type.

Let's have a look at a function that is specialized for searching for a
`Double` in an array of doubles, i.e: `Array[Double]`.

```scala
def binarySearch(ds: Array[Double], key: Double): Int = {
  @annotation.tailrec
  def go(low: Int, mid: Int, high: Int): Int = {
    if (low > high) -mid - 1
    else {
      val mid2 = (low + high) / 2
      val d = ds(mid2)
      if (d == key) mid2
      else if (d > key) go(low, mid2, mid2-1)
      else go(mid2 + 1, mid2, high)
    }
  }
  go(0, 0, ds.length - 1)
}
```

Now, what is not really important here is the algorithm details, but was is
important is to realise that above algorithm will look exactly the same for
the type `Int`. The only difference would be that we have changed the type
from `Double` to `Int`. Similarly, the same argument holds for other types
like `String`. We can generalize this function to work on any type _A_.

```scala
def binarySearch[A](as: Array[A], key: A, gt: (A,A) => Boolean): Int = {
  @annotation.tailrec
  def go(low: Int, mid: Int, high: Int): Int = {
    if (low > high) -mid - 1
    else {
      val mid2 = (low + high) / 2
      val a = as(mid2)
      val greater = gt(a, key)
      if (!greater && !gt(key,a)) mid2
      else if (greater) go(low, mid2, mid2-1)
      else go(mid2 + 1, mid2, high)
    }
  }
  go(0, 0, as.length - 1)
}
```

This is an example of a _polymorphic function_. Here we abstract over the type
of the function and the comparison function used for searching it.

Now, let's write some polymorphic functions.

### Exercises ###

Let's now take the oppurtunity to try implement the function signatures
below:

```scala
def partial1[A, B, C](a: A, f: (A, B) => C): B => C
```
Now, also write down a concrete usage of it. Take note: Because of the types,
there is _only_ one implementation that will work and satisfy the compiler!

```scala
def curry[A, B, C](f: (A, B) => C): A => (B => C)
```

Currying converts a function of `n` arguments to a function of exactly one
argument that returns another function as the result. Again, there is only
one valid implementation that type-checks.

```scala
def uncurry[A, B, C](f: A => B => C): (A, B) => C
```

```scala
def compose[A, B, C](f: B => C, g: A => B): A => C
```

Additionally take note that the signature of `compose`, `curry` and `uncurry`
do not make any assumptions about the complexity of the functions they take,
only that the types that are defined in the signatures line up.
