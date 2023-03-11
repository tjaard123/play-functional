# Functional Data Structures #

## Introduction ##

Previously, it was mentioned that functional programs do not update variables
nor mutate data structures in place. Several questions are raised as a
result - what sort of data structures are used in functional programming?

In this section we will explore the use and definition of _functional data
structures_, as well as _pattern matching_.

## Defining functional data structures ##

Functional data structures are, unsurprisingly, operated on using only
pure functions. If you recall, pure functions operate only on the data
passed into them - therefore functional data structures are _immutable_. This
means that if you have list like structures and you concatenate them
together using an operator such as `++`, the original structures are not
modified at all, instead a new structure is created as the result.

Immutable data structures are structures that are structures that are based
on specific _values_ that define the _data constructors_ for the type.

Right, that was a mouthful. What does that mean? Well, a data constructor
is something that can be used to create a specific value of the type. Let's
look at the `List` type to make this stuff more concrete.

`List` is a type that has two distinct and unique data constructors:

* Cons(head: A, tail: List[A])
* Nil

This should be sparking something in your head. The `Cons` data constuctor
has a specific structure - that being that it is `recursive`. Additionally,
the type is polymorphic with the type `A`.

Just for completeness, this is what is known as a rank-1 type constructor.
For example, you cannot use `List[A]` - it is rather meaningless on it's own
but if you provide a type for `A`, then you get a _new type_ as a result,
i.e: a list of integers.

Let us now look at some examples of how to define our own list data structure.
In `Haskell`, we would define our own `MyList` structure as follows:

```haskell
data MyList a = Cons a (MyList a) | Nil
```
As you can see, the type is `MyList` which takes a single type and can be
created using two data constructors: `Cons` or `Nil`. We will be building up
our own set of combinators (functions) for the `MyList` type in the sections
that follow.

## Pattern Matching ##

Pattern matching is a language feature that allows the programmer to inspect,
descend and extract subexpressions from
the structure of the data that he/she is working with. Many compare it to a fancy `switch` statement, but those descriptions couldn't be further from the truth.

In `Scala` you would use the syntax:
```scala
e match { case e_1 => r_1 ; ... case e_n => r_n }
```

`F#` also has a similar expression, but `Haskell` does not. In `Haskell`
the parameters to a function can be specified in the function definition,
which is the way `Haskell` does pattern matching. For example:
```haskell
brokenSum :: (Num a) => a -> a -> a
brokenSum 0 b = 0
brokenSum a 99 = 7
brokenSum _ _ = 42
```

Exercise: What would the following `Scala` pattern match yield?
```scala
val x = List(1,2,3,4,5) match {
  case Cons(x, Cons(2, Cons(4, _))) => x
  case Nil => 42
  case Cons(x, Cons(y, Cons(3, Cons(4, _)))) => x + y
  case Cons(h, t) => h + sum(t)
  case _ => 101
}
```

As always, you are encouraged to experiment with pattern matching to get a
deeper understanding of how it works.

## Functional data structures and data sharing ##

So we have immutable data. Now, how do we write functions that operate on
these structures?

Imagine that you have a list, say `xs`, and we want to add a new element
say `1` to the front of the list? The answer is simple, we return a new list
in this case: `Cons 1 xs`.

This introduces a property of immutable data known as _data sharing_. Because
data is immutable, we don't have to concern ourselves with inplace mutations,
multiple thread access, no need to perssimistically create copies of the data
etc, and as a result we can just use what is already
created. This allows us to implement efficient operations because we always
return new immutable data.

The same can be said for removing the first element of a list. For example:
Removing `1` from the structure `Cons 1 xs`, just results in `xs` being returned.
To be really academic / technical, there is no actual removal happening. The
original list is still available, completely unharmed. This results in the
second property of functional data structures - that they are _persistent_.

Lets implements some operations on lists that we can use to "modify" our data.

* Implement the `tail` function which removes the first element of the list.
  Take note that this operation is constant time.
* Generalize the `tail` funciton to be the `drop` function which removes the
  first `n` elements in the list.
* Implement the function `dropWhile` which removes items from the front of the
  list, as long as they match the given predicate function.
* Implement the function `init` which returns a list, except the last element.
  This function can sort of be seen as the inverse of `tail`.

## Recursion over lists and higher order functions ##

Let's have a look at two functions that can work with our `MyList`

```scala
def sum(ints: MyList[Int]): Int = ints match {
  case Nil => 0
  case Cons(x,xs) => x + sum(xs)
}
def product(ds: MyList[Double]): Double = ds match {
  case Nil => 1.0
  case Cons(x, xs) => x * product(xs)
}
```

Look how similar both functions are. As eluded to previously, when such
patterns present themselves, you can generalize it away by pulling subexpressions
out into function arguments. If the subexpressions refer to any local values
(like the `+` and the `*`) turn the subexpression into a function that accepts
these values as arguments.

Now, a generalized function for the above needs:
1. A default value if the list is empty
2. A function to add the element to the result when nonempty.

The resulting function is then:

```scala
def foldRight[A,B](l: List[A], z: B)(f: (A, B) => B): B = l match {
  case Nil => z
  case Cons(x, xs) => f(x, foldRight(xs, z)(f))
}
def sum2(l: List[Int]) =
  foldRight(l, 0.0)(_ + _)
def product2(l: List[Double]) =
  foldRight(l, 1.0)(_ * _)
```

As an example to see the operation, here is the _trace_ of
`foldRight(Cons(1, Cons(2, Cons(3, Nil))), 0)(_ + _)` - we repeatedly
substitute the definition of `foldRight` in its usages (remember the
substitution model).

```
foldRight(Cons(1, Cons(2, Cons(3, Nil))), 0)(_ + _)
1 + foldRight(Cons(2, Cons(3, Nil)), 0)(_ + _)
1 + (2 + foldRight(Cons(3, Nil), 0)(_ + _))
1 + (2 + (3 + (foldRight(Nil, 0)(_ + _))))
1 + (2 + (3 + (0)))
6
```

Now, try to compute the length of a list using `foldRight`

```scala
def length[A](l: MyList[A]): Int
```

`foldRight` is not a tail recursive function and will result in a
stack overflow for large lists. Convince yourself that this is indeed so
and write another general list-recursion function, `foldLeft` that is
tail-recursive, using techniques we discussed previously. The signature for
the function is:

```scala
def foldLeft[A, B](l: MyList[A], z: B)(f: (B, A) => B): B
```

Transforming a structure into another is very useful, so much so that a function
exists to do this. Write the `map` function

```
def map[A, B](l: MyList[A])(f: A => B): MyList[B]

map :: (a -> b) -> MyList a -> MyList b
```

Another useful function is `filter`:

```
def filter[A](l: MyList[A])(f: A => Boolean): MyList[A]

filterr :: (a -> Bool) -> [a] -> [a]
```

Now we can define a function that takes a function, just like `map`, but
returns a `MyList`. The result should be inserted into the final result:

```
def flatMap[A, B](l: MyList[A])(f: A => MyList[B]): MyList[B]

flatMap :: (a -> [b]) -> [a] -> [b]
```

## Functional Trees ##

A `List` is just one example of what is known as an _algebraic data type_ (ADT).
This should not be confused with the OO version which is termed an
abstract data type (weird name for something). An ADT is nothing more than
the _sum_ or _union_ of its data constructors, where each data constructor is
the _product_ of its arguments. Hence the name _algebraic_ data type and just
to reiterate, this naming is not co-incidental. There is a deep connection
between "multiplication" and "addition" of types that form an ADT and
the addition and multiplication of numbers.

Now, let's have a look at a binary tree data structure:

```
sealed trait Tree[A]
case class Leaf[A](value: A) extends Tree[A]
case class Branch[A](left: Tree[A], right: Tree[A]) extends Tree[A]

data Tree a = Leaf a | Branch (Tree a) (Tree a)
```

Pattern matching again provides a convienient way of operating over this ADT.
Let's look at some functions:

```
def size[A](t: Tree[A]): Int

size :: Tree a -> b
```

Now write the function `map` which is analogous to the `map` defined for
`MyList`

```
def map[A, B](l: Tree[A])(f: A => B): Tree[B]

map :: (a -> b) -> Tree a -> Tree b
```
