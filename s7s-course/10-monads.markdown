# Monads #

![Monads!](img/monad.png)

## Introduction ##

For many people the term `Monad` is a horrible and dangerous word, but it
really is not. The fact of the matter is that you use `Monad`s _ALL THE TIME_.

Monads are not a complex or scary concept. The scary part is in fact the name
_Monad_. The name is based in mathematics so the mathematicians had their
reasons to call it this.

The simplest fact you should know is that a Monad is nothing but simple
function composition - it's the stuff that you have been looking at during
these sessions.

Mathematically, a Monad is nothing more than a Monoid in the category of
endo-functors.

We are not going to focus on the theory here, but there are a few things
that we need to make sure of.

The big question is: "Why do I care about what is and is not a Monad?". The
answer is pretty simple actually: it provides you with a very useful interface
that you can use to write generic, DRY and succinct code. This is the main
reason why monads matter, but there are others and we will look at them as we
progress through this material.

But, just to re-iterate: Monads are not magical! They are simple and obvious
once you can see what they are doing.

## Generalizing `map`: The Functor ##

Things that can be `mapped` over have a general structure. This structure is
what we are interested in. This is the same thing that the mathematicians are
interested in. Working with a structure is much more important that the actual
values inside. For example, when you are reversing a `List[A]` you don't care
what `A` is! The fact that a list is reversable is because of the structure
of the data structure, not what it contains.

That's all there is for a Functor! We can extract this interface to look like
this:
```haskell
class Functor f where
  fmap :: (a -> b) -> f a -> f b
```

```scala
trait Functor[F[_]] {
  def map[A, B](fa: F[A])(f: A => B): F[B]
}
```

The data structure `List[A]` has a functor instance:

```haskell
instance Functor [] where
  fmap = map
```

```scala
object ListFunctor extends Functor[List] {
  def map[A, B](fa: List[A])(f: A => B): List[B] = fa map f
}
```

Now, look at the `distribute` function (which is called `unzip` in some cases):
```scala
def distribute[A,B](fab: F[(A, B)]): (F[A], F[B]) =
  (map(fab)(_._1), map(fab)(_._2))
```

Note that the above is for _any functor_!

## So looking at Monads ##

Basically a monad can be extracted into the following interface:
```scala
trait Monad[M[_]] extends Functor[M] {
  def unit[A](a: => A): M[A]
  def flatMap[A,B](ma: M[A])(f: A => M[B]): M[B]
  def map[A,B](ma: M[A])(f: A => B): M[B] =
    flatMap(ma)(a => unit(f(a)))
  def map2[A,B,C](ma: M[A], mb: M[B])(f: (A, B) => C): M[C] =
    flatMap(ma)(a => map(mb)(b => f(a, b)))
}
```

In the .net world, LINQ is all about monads! You can replace the following
function names for LINQ:

```
  flatMap -> SelectMany
  map -> Select
```

That great and all, but what is the point? The point is that a monad allows
you to easily compose different monadic actions together. We will be looking
at some examples from ehre on out. Please note that depending on what the monad
instance is, you can obtain differing behavior. Additionally, take note that
monads require abstracting over type constructors and not just values.

I think I just heard glass shatter, but lets slowly understand what the above
paragraph actually means. The following is a type that abstracts over values,
`List[A]`, as you can see the abstraction is over the `A` bit in the type
definition. This, however, does not abstract over the value but rather
abstracts over the _type constructor_: `Map[String, A]` - here you get a
different `Map` instance for each type of `A`. This brings us to an important
point: Monads require you to have a single undefined type in the type
constructor. This is sadly where various languages start to fail. For example
Java, C#, F#, C++, C etc all cannot express the extracted monad interface
and as a result require you to implement specific versions of each implementation
which creates a lot of boilerplate, but notice that I never said that you cannot
use monads in these languaages. You can, with some elbow grease and the benefits
far outweigh the pain. This is not speculation - this is fact.

Some common monad instances that you will start to recognise are:
  * `Identity`
  * `Option` / `Maybe`
  * `Either`
  * `List`
  * `State`
  * `Reader`
  * `Writer`

Additionally, here is a thought:

## Some usages ##

Below are some examples of how we can use monads to simplify our code but
in a why that allows for reasoning to continue without the need to introduce
magic. Magic is a set of tools which should never be used as they do
result in code that is inherently unsafe and guaranteed brittle. Let's just
be honest, such software is pathetic and anyone writing such code should be
ashamed - but fear not, there is hope and hope in such a way that the compiler
becomes a friend and helps you along the way.

Let's look at some contrived examples, but these examples should give an
indication of how the monads are used. In this section we will just be
reading and trying to understand. In the next part of the monads chapter
we will actually go into the details and the laws that govern how monads
operate and how to "compose" monads through the use of monad transformers.

### Identity ###

The identity monad is the most simple of all monads. Anything can be put
into the identity context and how you expect it to work is exactly how it
does work.

```scala
for {
  a <- Id(5)
  b <- Id(4)
} yield a + b
```

### Option ###

```scala
def getConnection: Option[Connection] =
  for {
    username <- optional("username")
    password <- optional("password")
    connString <- optional("connectionString")
  } yield new Connection(connString, username, password)
```

Where each of the "optional" funcitons could look something like:
```scala
def optional(key: String): Option[String] =
  collectionOfProperties.get(key)
```

Now think about what is going on above and how this will improve your
coding style and soundness.

```haskell
getConnection :: Maybe a -> Maybe a -> Maybe a -> Maybe b
getConnection ma mb mc = do
  a <- ma
  b <- mb
  c <- mc
  return (Connection c a b)
```

### Either ###

```scala
for {
  a <- either("username")
  b <- either("password")
  c <- either("connString")
} yield new Connection(c, a, b)
```

Here we can write the `either` function as follows, note how it fails
to lookup a password:
```scala
def either(s: String): Exception \/ String =
  if (s === "password") Left(new SillyException("I'm failing here to prove a point"))
  else optional(s) match {
    case None => Left(new SillyException("Could not find the property in the given properties"))
    case Some(x) => Right(x)
  }
```

Thoughts on how the above works?

### List ###

```scala
for {
  a <- List(1,2,3,4,5)
  b <- List(8,7,6,5,4)
} yield (a, b)
```

### State ###

`State` is a

### Reader ###

The Reader monad is also referred to as the environment monad. It is everythings
that an IoC container wants to be, but IoC fails to do so. This means that the various
IoC containers such as Spring, Guice and Dagger in the Java world an Ninject etc in
the .net world are pointless in comparison. The Reader monad can implement IoC
in a little over 30 lines of Java code, or in less than 10 lines of Scala.

Essentially, Inversion of Control is just a pretentious way of saying
"accepting an argument" - Does Spring compensate for a lack of language features?﻿
It may be it compensates lack of imagination.

The point of the Reader is that you have some immutable instance which you need to
pass to a colleciton of different actions that need it to create their results

```scala
case class Reader[C, A](g: C => A) {
  def apply(c: C) = g(c)
  def map[B](f: A => B): Reader[C, B] = Reader(c => f(g(c)))
  def flatMap[B](f: A => Reader[B]): Reader[C, B] = Reader(c => f(g(c))(c))
}

def pure[A](a: A): Reader[C, A] = Reader(c => a)

type Inject[A] = Reader[Config, A]

val user: Inject[ConfiguredUser] = for {
  a <- getUser
  b <- getPassword
} yield ConfiguredUser(a, b)
```

### Writer ###

The writer monad allows monadic actions to record another value that is kind
of like a log. This means that actions that result in trace output can now be
writen in a pure fashion.

```scala
def logNumber(x: Int): Writer[List[String], Int] =
  x.set(List("got number: " + x.shows))

def multWithLog: Writer[List[String], Int] = for {
  a <- logNumber(3)
  b <- logNumber(5)
} yield a * b

multiWithLog.run // returns (List(Got number: 3, Got number: 5),15)
```
