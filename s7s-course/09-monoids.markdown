# Monoids

So we have seen some ways in which we can use _algebras_ to ensure the sane
behaviour of data types - that is the laws that they support which untimately
determine the operations that are possible. Different data types can share
common patterns and we will start to look at identifying these patterns and
extracting them into separate abstractions, such that we can use such
abstractions for _all_ data types that share a common algebra.

We will start by looking at the _monoid_ because they are a very simple
abstraction and are extremely prevalent in software - they come up
whether you are aware of this fact or not. Concatenating strings or even
accumulating in a loop, you are most certainly using a monoid.

## What is a monoid? ##

Consider the algebra that is available to concatenate strings. Strings
can be added: `"foo" + "bar"` to get `"foobar"`, and the empty string (`""`)
is an _identity_ element for that operation.

What does that mean? Well, if you had the expressions (`"" + a`) or (`a + ""`),
the final result would be exactly the same - that is `a`. Furthermore,
combining three strings (`r + s + t`) indicates that the operation of string
concatenation is _associative_ - it simply does not matter what the order
of parameterization is, but the order of concatenation is. Putting this
into an example: `((r + s) + t)` is the same as `(r + (s + t))`.

Well, what about other domains? The same rules can be applied to integer
addition. The operation `+` is associative and the identity element is `0`.
The same goes for integer multiplication, except that the identity element
is not `0` but is `1` instead. Why?

Boolean operators `&&` and `||` are also associative and have the identity
elements of `true` and `false` respectively.

So these examples highlight a few things, but you should be able to realize
that algebras like this are everywhere and this is exactly what the
term "_monoid_" means. As with any algebra, there are some laws that must hold
that ensure the validity of the algebra. In the case of monoids, they are known
as the _monoid laws_. Monoids consist of (note that there is absolutely no
ambiguity related to this defintion):

   * Some type `A`
   * A binary associative operation that takes two values of type `A` and
     combines them into a single value of type `A`
   * A value of type `A` that is the identity element for that operation

We can express this in code:

```
trait Monoid[A] {
  def op(a1: A, a2: A): A
  def zero: A
}

class Monoid a where
  mappend :: a -> a -> a
  mzero :: a
```

An instance of this would be the `String` monoid:

```
val stringMonoid = new Monoid[String] {
  def op(a1: String, a2: String) = a1 + a2
  def zero = ""
}

instance Monoid String where
  mappend = (++)
  mzero = ""
```

List concatenation is also a monoid:

```scala
def listMonoid[A] = new Monoid[List[A]] {
  def op(a1: List[A], a2: List[A]) = a1 ++ a2
  def zero = Nil
}
```

Implement the folowing monoids as an exercise:

```scala
val intAddition: Monoid[Int]
val intMultiplication: Monoid[Int]
val booleanOr: Monoid[Boolean]
val booleanAnd: Monoid[Boolean]
```

Now provide a `Monoid` instance for combining `Option`s:

```scala
def optionMonoid[A]: Monoid[Option[A]]
```

You might not realise, but functions that have the same type of domain and
range are monoids as well:

```scala
def EndoMonoid[A]: Monoid[A => A]
```

There is a slight terminology mismatch here that we should address now.
Programmers think (usually) that an instance of the type `Monoid[A]` as
being a _monoid_. To have the accurate terminology, a monoid is really both
things - the type together with the instance. When we say that a method
accepts a value of type `Monoid[A]`, we do not say that it takes a monoid,
but that there is evidence that the type `A` is a monoid. After all, a monoid
is defined separately and as a result we require that there be that evidence
that the type has a monoid instance.

So that is basically what a monoid is. It is nothing more than a binary
associative operator (`op`) which has an identity element (`zero`).

The next obvious question is: _Does this buy me anything?_ The answer is an
unsurprising: "Absolutely!".

## Folding with monoids ##

Monoids have an intimate connection with lists. Look at the following
definitions:

```scala
def foldRight[B](z: B)(f: (A, B) => B): B
def foldLeft[B](z: B)(f: (B, A) => B): B
```

What happens when `A` and `B` are the same type?

```scala
def foldRight(z: A)(f: (A, A) => A): A
def foldLeft(z: A)(f: (A, A) => A): A
```

The components of the monoid fit the above like a glove! As you can see, there
is no difference when folding with a monoid (the signatures are the same,
barring the names). This means that we should get the same result when folding
with a monoid - this is because the laws of associativity and identity hold.
See how a giant amount of insight has been gained by being able to reason
about the code simply by inspecting the types.

Write a monoid that would insert spaces between words (unless there is already
one) and will trim the final result. For example:

```
op("I", op("like ", "monoids ")) == "I like monoids"
op(op("I ", " like"), "monoids") == "I like monoids"
```

Implement the function `concatenate`, a function that folds a list with
a monoid:

```scala
def concatenate[A](as: List[A], m: Monoid[A]): A
```

Now, what if the list element doesn't have a monoid instance? Well, we can
always `map` over the list to turn it into a type that does have a monoid
instance (FYI: This is a sinple function is that is the core premise of
what is today a very popular technique called "map/reduce" - if fact it can
be reduced to the following function):

```scala
def foldMap[A,B](as: List[A], m: Monoid[B])(f: A => B): B
```

## Associativity and parallelism ##

Because the monoid's binary operator is associative results in a great amount
of flexibility in how the data structure could be folded. In fact, because
the operator is associative, it means that you could run the operator in
parallel and combine the intermediate results using the monoid.

As an example, look at the following:

```
op(a, op(b, op(c, d)))
```

The same result could also be formulated as:

```
op(op(op(a, b), c), d)
```

Similarly, you could apply the operator in a parallel fashion:

```
op(op(a, b), op(c, d))
```

This might result in performance gains as the two inner operations could be run
simultaneously.

## Foldable data structures ##

Previously we looked at different data structures over which we could `fold`.
These included the `List`, `Tree` and `Stream` and when we were investigating
the ways of processing the data within these structures we really did not
care about the shape of the structure we were using. We could just as easily
have a structure that is full of integers and we would like to calculate
the sum - we could use a `foldRight`:

```scala
ints.foldRight(0)(_ + _)
```

The code above does not tell us what structure `ints` is - it could be a
`Stream` or a `List`, or anything at all that has a `foldRight` method.
This commonality can be captured in a trait:

```scala
trait Foldable[F[_]] {
  def foldRight[A, B](as: F[A])(f: (A, B) => B): B
  def foldLeft[A, B](as: F[A])(f: (B, A) => B): B
  def foldMap[A, B](as: F[A])(f: A => B)(mb: Monoid[B]): B
  def concatenate[A](as: F[A])(m: Monoid[A]): A =
    as.foldLeft(m.zero)(m.op)
}
```

Here we are abstracting over the structure (denoted by the type constructor `F`)
much like we have with previous structures that we have studied. A type
constructor, also referred to as a _higher-kinded type_, is a type that
requires another type in order to be useful. Ironically, even though this
might seem strange defined in this way, you have had experience with several
higher-kinded type constructors. The syntax above, `F[_]`, indicates that
the type constructor is expecting a single type argument (the underscore
represents a placeholder for this missing type value).

Can you think of some `Foldable` structures? The most obvious could be the
`List[A]` type constructor for some type `A`. Implement the following
`Foldable` instances (remember that `foldRight`, `foldLeft` and `foldMap` can
all be implemented in terms of each other - efficiencies excluded):

   # `Foldable[List]`
   # `Foldable[Stream]`

Now implement the `Foldable` instance for `Tree` which is obviously not
a linear-like structure. The `Tree` data constructors are listed below for
convienience:

```scala
sealed trait Tree[+A]
case object Leaf[A](value: A) extends Tree[A]
case class Branch[A](left: Tree[A], right: Tree[A]) extends Tree[A]
```

Next, write the instance `Foldable[Option]` and then the implementation of the
following function, which can take any `Foldable` structure to a `List`:

```scala
def toList[A](fa: F[A]): List[A]
```

## Monoid composition ##

The real power of the `Monoid` abstraction is that monopids compose, or put
in another way: "Monoids beget other monoids". This means that if we had types
`A` and `B` which have `Monoid` instances, then the tuple type `(A, B)` is
also a monoid (the tuple is called the _product_ of `A` and `B` - this is also
the way that ML-like languages define tuples, e.g: `'a * 'b`).

Implement the product monoid.

```scala
￼def productMonoid[A,B](a: Monoid[A], b: Monoid[B]): Monoid[(A, B)]
```

And now for the co-product:

```scala
￼def coproductMonoid[A,B](a: Monoid[A], b: Monoid[B]): Monoid[Either[A, B]]
```

### More complex monoids

Some structures have interesting monoids, as long as their value types are
monoids as well. An example of this is that there exists a monoid for merging
the key-value pairs of `Map`s, provided that the value type has a monoid
instance.

```scala
def mapMergeMonoid[K,V](V: Monoid[V]): Monoid[Map[K, V]] =
  new Monoid[Map[K, V]] {
    def zero = Map()
    def op(a: Map[K, V], b: Map[K, V]) =
      a.map {
        case (k, v) => (k, V.op(v, b.get(k) getOrElse V.zero))
      }
  }
```

Using this monoid is very simple:

```scala
scala> val M: Monoid[Map[String, Map[String, Int]]] =
     | mapMergeMonoid(mapMergeMonoid(intAddition))
M: Monoid[Map[String, Map[String, Int]]] = $anon$1@21dfac82
```

And its usage:

```scala
scala> val m1 = Map("o1" -> Map("i1" -> 1, "i2" -> 2))
m1: Map[String,Map[String,Int]] = Map(o1 -> Map(i1 -> 1, i2 -> 2))

scala> val m2 = Map("o1" -> Map("i2" -> 3))
m2: Map[String,Map[String,Int]] = Map(o1 -> Map(i2 -> 3))

scala> val m3 = M.op(m1, m2)
m3: Map[String,Map[String,Int]] = Map(o1 -> Map(i1 -> 1, i2 -> 5))
```

As exercises, implement a monoid instance for functions whose results
are monoids

```scala
def functionMonoid[A,B](B: Monoid[B]): Monoid[A => B]
```

Now use monoids to compute the frequency map of words in a `List` of
`String`s.

```scala
def frequencyMap(strings: IndexedSeq[String]): Map[String, Int]
```

The usage would be:

```scala
scala> frequencyMap(Vector("a rose", "is a", "rose is", "a rose"))
res0: Map[String,Int] = Map(a -> 3, rose -> 3, is -> 2)
```

### Using composed monoids to fuse traversals

Because monoids allow for composition, you can use a composed monoid instance
to do different actions simultaneously. As a simple example, you could use
the product of two monoids to determine both the length and the sum of a
list at the same time.

```scala
scala> val m = productMonoid(intAddition, intAddition)
m: Monoid[(Int, Int)] = $anon$1@8ff557a

scala> val p = listFoldable.foldMap(List(1,2,3,4))(a => (1, a))(m)
p: (Int, Int) = (10, 4)

scala> val mean = p._1 / p._2.toDouble
mean: Double = 2.5
```

It might seem like a lot of manual construction to get the "right" monoids
ready for your specific need, but some language features can be used to allow
us to get the power without the boilerplate. Both in Scala and in Haskell this
is possible. Within Scala, you can use the `implicit` lanuage feature to get the
compiler to provide you the correct instance, if it can find it based on its
implicit resolution rules. Haskell does something similar, searching for the
correct instance declaration when needed.

## "Real world" example ##

For some reason there is this trend to ask developers to implement a solution
to the "FizzBuzz" problem. The problem is formulated as follows:


    Write a program that prints the numbers from 1 to 100. But for multiples of
    three print “Fizz” instead of the number and for the multiples of five
    print “Buzz”. For numbers which are multiples of both three and five
    print “FizzBuzz”.

If you where to "attack" this problem you'll probably get to a solution that
might look like (in python because C is just too verbose):

```python
for i in xrange(1, 101):
  if i % 15 == 0:
    print "FizzBuzz"
  elif i % 3 == 0:
    print "Fizz"
  elif i % 5 == 0:
    print "Buzz"
  else:
    print i
```

Seems reasonable? Perhaps. Now what if the requirements changed and you needed
to add that multiples of seven need to print out the value "Baz"?

```python
for i in xrange(1, 101):
  if i % 105 == 0: # Can't reach, but for completeness.
    print "FizzBuzzBazz"
  elif i % 35 == 0:
    print "BuzzBazz"
  elif i % 21 == 0:
    print "FizzBazz"
  elif i % 15 == 0:
    print "FizzBuzz"
  elif i % 3 == 0:
    print "Fizz"
  elif i % 5 == 0:
    print "Buzz"
  elif i % 7 == 0:
    print "Bazz"
  else:
    print i
```

Geez... this is really awful. The issue with this is that the solution to this
problem is _extremely_ brittle and fragile. It would be foolish to describe the
solution to this prblem like this as more cases would result in a complete
explosion in the number of cases and you would more than likely risk missing
a case.

The other issue in this code is that making decisions requires knowledge of
what happened previously, which this code does not correctly encode and will
result in some problems when run.

So, how can we fix this? I'm assuming that you are expecting a `Monoid` to be
the solution and you would be partially correct. The other missing part is that
we are going to be using the `Option` data type, together with its `Monoid`
instance. We will not discuss this implementation here, but you are encouraged
to ask questions if you do not understand the code.

```haskell
{-# LANGUAGE MonadComprehensions #-}

module Main where
import Data.Monoid (mappend)
import Data.Maybe (fromMaybe, listToMaybe, maybe)
import System.Environment (getArgs)


fizzbuzz i = fromMaybe (show i) $ mappend ["fizz" | i `rem` 3 == 0]
                                          ["buzz" | i `rem` 5 == 0]

-- mapM_ is our iterator, putStrLn writes to console.
main = mapM_ putStrLn [ fizzbuzz i | i <- [1..100] ]
```

Now for the Scala (uses the `Scalaz` library):

```scala
import scalaz._
import Scalaz._

// .suml is a function that combines the values in a List using a monoid
// In this case the monoid is Option[String]
def toOption(i: Int) = List(
    if (i % 3 == 0) Some("Fizz") else None,
    if (i % 5 == 0) Some("Buzz") else None
  ).suml

(1 to 100) map (x => toOption(x).getOrElse(x.toString)) foreach println
```

What would you need to change to cater for the case where multiples of seven
print "Baz"?
