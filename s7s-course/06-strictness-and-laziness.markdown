# Strictness and laziness #

Previously we looked at some common operations on the list datastructure,
including `map`, `filter`, `foldLeft`, `foldRight`, `zip`, etc. As noted,
each of these operations make a single pass over the list, to produce a new
list.

If you have to remove both odd-numbered and queens from a deck of cards,
you would ideally like to do it one pass and not go through the deck twice,
once for each type of card to remove.

Look at the following snippet (we will be focusing on `Scala` in this section
as the language is strict by default, whereas `Haskell` is lazy):

```
List(1,2,3) map (_ + 10) filter (_ % 2 == 0) map (_ * 3)
```

In the above expression, `map (_ + 10)` will produce a new list which is then
used in the `filter` operation, which also yields a new list. The final `map`
then does the same and produces the final list which is the result of the
total expression. In each intermediate step, the resulting lists are discarded
and are simply the glue connecting the subexpressions. In other words,
the evaluation of the above would actually be (note the intermediate list creation):

```
List(1,2,3) map (_ + 10) filter (_ % 2 == 0) map (_ * 3)
List(11,12,13) filter (_ % 2 == 0) map (_ * 3)
List(12) map (_ * 3)
List(36)
```

This makes it evident that the calls to `map` and `filter` each result
in their own traversals of the list structure. Comparing this to the extraction
of cards from a deck, it is akin to traversing the deck twice - the first
time for the odd-numbered cards and the second for the queens. It would be
advantageous to somehow __fuze__ these operations, thereby preventing these
intermediate structures. One option is to rewrite the code so that the functions
are all combined - but that really defeats the purspose. We want to use
higher-order functions such as `map` and `filter` instead of manually
fusing this logic together.

We can achieve this by using _non-strictness_ (or more informally _laziness_).
We will explain this by considering a lazy list implementation that fuses
sequences of transformations.

## Lazy Lists ##

Also known as a `Stream`, lets have a look how they can improve efficiency in
functional programs and how operations can be fuzed together.

```scala
trait Stream[+A] {
  def uncons: Option[(A, Stream[A])]
  def isEmpty: Boolean = uncons.isEmpty
}

object Stream {
  def empty[A]: Stream[A] =
    new Stream[A] { def uncons = None }

  def cons[A](hd: => A, tl: => Stream[A]): Stream[A] =
    new Stream[A] {
      lazy val uncons = Some((hd, tl))
    }

  def apply[A](as: A*): Stream[A] =
    if (as.isEmpty) empty
    else cons(as.head, apply(as.tail: _*))
}
```

Notice that the `cons` function is non-strict in it's parameters (using the
by-name parameter syntax available in `Scala`).

Now, let's implement some helper functions for the `Stream` type.

```scala
def toList: List[A]
```

```scala
def take(n): Stream[A]
```

```scala
def takeWhile(p: A => Boolean): Stream[A]
```

## Separating program description from evaluation ##

Laziness allows for the separation of an expressions description from the evaluation
of that expression. This is extremely powerful as it allows us to "describe" a larger
expression than we need, and then only evaluate a portion of it. Let us now consider `foldRight`
implemented for a `Stream`, but in a lazy fashion:

```scala
def foldRight[B](z: => B)(f: (A, => B) => B): B =
  uncons match {
    case Some((h, t)) => f(h, t.foldRight(z)(f))
    case None => z
  }
```

The implementation of `foldRight` is very similar to the version we had for the normal
`List` but notice how the combining function `f` is non strict in its second parameter.
If `f` chooses not to evaluate the second parameter, the evaluation could terminate early.
Let's make this more clear and provide an implementation for the function `exists`:

```scala
def exists(p: A => Boolean): Boolean =
  foldRight(false)((a, b) => p(a) || b)
```

This is an example of how the _description_ of the computation is detached from
_evaluation_ making our descriptions much more reusable, in contrast to when
we have concerns intertwined.

Now implement `forAll` which checks that all elements in the `Stream` match the
given predicate:

```scala
def forAll(p: A => Boolean): Boolean
```

Now implement `takeWhile` using `foldRight` and then implment the `map`, `filter`,
`append` and `flatMap` using `foldRight`.

Because the changes are incremental, chains of computations will fully avoid the
creation of intemediate data structures. To illustrate this, lets have a look at
the following expression trace:

```scala
Stream(1,2,3,4).map(_ + 10).filter(_ % 2 == 0)
```

```scala
Stream(1,2,3,4).map(_ + 10).filter(_ % 2 == 0)
(11 #:: Stream(2,3,4).map(_ + 10)).filter(_ % 2 == 0)
Stream(2,3,4).map(_ + 10).filter(_ % 2 == 0)
(12 #:: Stream(3,4).map(_ + 10)).filter(_ % 2 == 0)
12 #:: Stream(3,4).map(_ + 10).filter(_ % 2 == 0)
12 #:: (13 #:: Stream(4).map(_ + 10)).filter(_ % 2 == 0)
12 #:: Stream(4).map(_ + 10).filter(_ % 2 == 0)
12 #:: (14 #:: Stream().map(_ + 10)).filter(_ % 2 == 0)
12 #:: 14 #:: Stream().map(_ + 10).filter(_ % 2 == 0)
12 #:: 14 #:: Stream()
```

## Infinite streams and corecursion ##

Because streams are incremental, the previous functions we have written also
work correctly for _infinte streams_. Let's have a look at an example infinte stream
of `1`s:

```scala
val ones: Stream[Int] = cons(1, ones)
```

Although `ones` is infinite, only a portion of the stream is inspected at any
given time in order to generate the needed output:

```scala
scala> ones.take(5).toList
res0: List[Int] = List(1, 1, 1, 1, 1)

scala> ones.exists(_ % 2 != 0)
res1: Boolean = true
```

You still obviously need to be careful to not write valid logical expressions that
never terminate, such as `ones.forAll(_ == 1)`. Now, generalize the stream `ones` slightly
and create the function `constant` which returns an infinite stream of a given value.

```scala
def constant[A](a: A): Stream[A]
```

Write a function that generates an infinite stream of integers that starts from `n`.

```scala
def from(n: Int): Stream[Int]
```

Now, implement the Fibronocci sequence using streams. Now, let's write a function that
takes an initial state, and a function for producing both the next state and next value in the
generated stream. This function is usually called `unfold`:

```scala
def unfold[A, S](z: S)(f: S => Option[(A, S)]): Stream[A]
```

The `unfold` function (and other functions that we can implement with it) are examples of
what is sometimes called **corecursion**. Recursive functions consume data and eventually
terminate, a corecursive function produces data and _coterminates_. The function is _productive_
which means that we can always evaluate more of the result in a finite time. Corecursion
is also sometimes known as _guarded recursion_. These terms are not really important to
the discussion but you may heear thim used in some context in functional programming.

Write the `fibs`, `from`, `constant` and `ones` in terms of `unfold`
