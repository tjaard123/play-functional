# Purely functional parallelism #

We are going to build a library for creating and composing parallel and
asynchronous computations.

Before we begin, think back to the functions and combinators we wrote for
the `Option` and `Stream` data types. For each of the data types, a number
of functions were defined that were useful to manipulate and create the
values of these types. in many cases there were _primitive_ functions, such
as `foldRight` and `unfold` which needed knowledge of the internal representation
of `Stream`. Then there were _derived_ functions that built on the
primitives that were defined.

Functional design requires that you choose data types and functions that
_facilitate this compositional structure_, and this makes functional
design both challenging and interesting.

## Choosing data types and funcitons ##

Our goal is to develop and even discover a data type an a set of primitive
functions that will correctly describe functional parallelism. Remember that
the evolution of a good API is a messy and iterative process.

So, when you begin to design a functional library, you need to have an idea
about what it is that you want to be able to do. The difficulty in the design
process is refining these ideas and finding a data type that enables the
functionality that you want at the end of the day. In this case, we want to
create "parallel computations".

But what does that mean? Assume that we want to sum a sequence of numbers:

```scala
def sum(xs: List[Int]): Int =
  if (xs.size <= 1) xs.headOption getOrElse 0
  else {
    val (l, r) = xs.splitAt(xs.length / 2)
    sum(l) + sum(r)
  }
```

This implementation is unlike the normal function using a `foldLeft`, which
is sequential. We are instead dividing the list up into halves and then
recursively summing those parts. Unlike the `foldLeft`, this function body
can be parallelized - the halves can be summed separately. How this summation
is done is not really relavent here but you can use threading, an executor,
actors or anything else that achieves the goal.

From this realization, we can see that _whatever_ the computation does, it needs
to yield a result - in this case `Int` - and we need a way to extract it. So,
applying this realization we can create a data type container for our
computation, `Par[A]` (for "parallel"), and assume that the following functions
exist:

   * `def unit[A](a: => A): Par[A]`, which takes an unevaluated `A` and returns
      a parallel computation that yileds the `A`.

   * `def get[A](a: Par[A]): A`, for extracting the result form the computation.

Can we just do this? Indeed we can. Now lets apply these functions to our
previous `sum` implementation:

```scala
def sum(xs: List[Int]): Int =
  if (xs.size <= 1) xs.headOption getOrElse 0
  else {
    val (l, r) = xs.splitAt(xs.length / 2)
    val sumL: Par[Int] = Par.unit(sum(l))
    val sumR: Par[Int] = Par.unit(sum(r))
    Par.get(sumL) + Par.get(sumR)
  }
```

Now the two recursive calls have been wrapped in calls to `unit`, and we
use `get` to extract the results from the two subcomputations. We need to now
determine the meaning of `unit` and `get`. `unit` could start computing the
value in the back ground immediately in a possibly separate (logical) thread.
Alternatively, it could hold onto the value passed to it until `get` is called
upon which the evaluation is started. However, looking at the above example,
we need to make sure that if we want any form of parallelism, `unit` will
need to start evaluating its argument immediately.

If `unit` begins evaluation immediately, the calls to `get` break referential
transparency. Substituting the `sumL` and `sumR` expression with their
definitions we see that although the end result is the same, we no longer
have a program that is parallel:

```
Par.get(Par.unit(sum(l))) + Par.get(Par.unit(sum(r))))
```

We can see that `unit` will need to start evaluation immediately, but the
call to `get` will wiat for the evaluation to complete before the reusult
is returned. In other words, both sides of `+` will not run in parallel if
we inline the `sumL` and `sumR` values. Basically, we need to delay the
call to `get` because `unit` has a very definite side-effect, but only as soon
as wel pass that `Par` to `get` which explicitly blocks until the computation
completes. Therefore, it would seem that we need to delay the call to `get`
until the very end. We want to combine asynchronous computations without
waiting for them to finish.

Take a moment to realise what we have done. Through experimentation and
reasoning we have found some very interesting properties about our domain.
Design will require such adventures to correctly achieve a design that
appropriately fits the given problem domain.

Can we simply remove the pitfall of combining `unit` and `get`? Let's
just invent some functions with the required function signatures:

```
def sum(as: List[Int]): Par[Int] =
  if (as.size <= 1) Par.unit(as.headOption getOrElse 0)
  else {
    val (l,r) = as.splitAt(as.length/2)
    Par.map2(sum(l), sum(r))(_ + _)
  }
```

Now, write the implementation of `map2` (it is the most general signature
possible). Notice that the calls to `map2` we no long have calls to `unit`
in the recursive case.

Should the parameters to `map2` be strict or lazy? We can see that if the
parameters are strict it is possible that the entire left half of the
computation will execute before the right. So it would seem that we should
make the parameters of `map2` lazy and have it begin evaluaiton immediately.
But is this always the case? Probably not. In simple cases, there is not much
benefit in spawning off an asunchronous task because the values execute so
quickly. There is some loss of information here - our API does not
provide any way of providing this sort of information. The API is very
_implicit_ about when computations get forked off the main thread - the
programmer cannot specify when the forking should occur.

We can make forking more explicit, and introduce another function
`def fork[A](a: => Par[A]): Par[A]`, which we can take to mean that the
given `Par` should execute in another thread.

```
def sum(as: List[Int]): Par[Int] =
  if (as.size <= 1) Par.unit(as.headOption getOrElse 0)
  else {
    val (l,r) = as.splitAt(as.length/2)
    Par.map2(Par.fork(sum(l)), Par.fork(sum(r)))(_ + _)
  }
```

Using fork, we can now make `map2` strict, leaving it up to the programmer to
wrap arguments. This means that the concerns of aysnchronous evaluation and
how results are combined are now separated. This avoids us needing some sort
of difficult to decide and potentially arbitrary decision regarrding which
global policy is best. It is quite common to see such decisions being made
by frameworks, where the policy is largely inappropriate in many cases.

Now, lets return to the `unit` function. Should it be strict or lazy? Well,
with `fork` we can now make `unit` strict without losing any expresiveness.
A non-strict version of `unit` can be implemented using `unit` and `fork`

```
def unit[A](a: A): Par[A]
def async[A](a: => A): Par[A] = fork(unit(a))
```

The function `async` is an example of a _derived_ combinator, as opposed to
a primitive combinator such as `unit`. As for the `fork` function, we still are
not sure how the internals of `fork` will work - will it begin evaluating
immediately or will it wait until `get` is called? If `fork` starts immediate
evaluation, it will need to know about some way (directly or indirectly)
about how to create threads or submit tasks to some sort of thread pool.
Additionally, if `fork` is a standalone function, as it is now, it implies
that the resource for thread creation should be _globally accessible_. This
means that we lose the ability to control parallelism. There may be nothing
wrong with such a strategy, but we lose the ability to apply finely grain
control of what parallel strategies we use can use and where. If `fork` holds
onto the computation until later, this requires no access to the mechanism
for implementing parallelism. With this model, `Par` itself does not know how
to implement parallelism but rather that it is a description of a parallel
computation. This is completely different from the notion that `Par` is a
container of a value which we can "get". It is more of a first-class _program_
that we can _run_. As a result, let's rename `get` to `run`.

```
def run[A](a: Par[A]): A
```

`Par` is now a pure data structure and we can assume that `run` has some
mechanism to implement the parallelism - be it spawning threads, delegating
to a thread pool or some other means.


## Picking a representation ##

Through exploring this simple example and thinking through some of the
consequences of different choices, we have sjetched out an API that looks like
this:

```
def unit[A](a: A): Par[A]
def map2[A,B,C](a: Par[A], b: Par[B])(f: (A,B) => C): Par[C]
def fork[A](a: => Par[A]): Par[A]
def async[A](a: => A): Par[A] = fork(unit(a))
def run[A](a: Par[A]): A
```

We can now start thinking about possible _representations_ for the abstract types
that appear. Let's try come up with a representation. We know that we need
to come up with some way that can execute the tasks asynchronously. We could
write our own API, but on the JVM we could use
`java.util.concurrent.ExecutorService`. The API for `ExecutorService` looks
like the following (transcribed to Scala):

```
class ExecutorService {
  def submit[A](a: Callable[A]): Future[A]
}
trait Future[A] {
  def get: A
  def get(timeout: Long, unit: TimeUnit): A
  def cancel(evenIfRunning: Boolean): Boolean
  def isDone: Boolean
  def isCancelled: Boolean
}
```

So we can submit a `Callable` and get back a corresponding `Future`. We can
block to obtain the value of a `Future` using its `get` method, and we can
use the other methods for cancellation etc.

Assume that our `run` function has an `ExecutorService` and see if that
suggests anything about the representation:

```
def run[A](s: ExecutorService)(a: Par[A]): A
```

The simplest representation for `Par[A]` might just be `ExecutorService => A`,
but could that really be as simple as that? Well, it might be and it might not
be, but lets take it as such for now.

```
type Par[A] = ExecutorService => Future[A]

def run[A](s: ExecutorService)(a: Par[A]): Future[A] = a(s)
```

## Exploring and refining the API ##

The derivation of the representation was a little contrived - in practice it
might not be so clear-cut. Let's explore how our creation behaves.

Let's begin by implementing some function that we have developed so far:

```
def unit[A](a: A): Par[A]
def map2[A,B,C](a: Par[A], b: Par[B])(f: (A,B) => C): Par[C]
def fork[A](a: => Par[A]): Par[A]
```

Now let's use what we have already to implement a function that can take any
function `A => B` into a function that evaluates its result asynchronously:

```
def asyncF[A,B](f: A => B): A => Par[B]
```

What else can we do with our existing combinators? Suppose we have a
`Par[List[Int]]` and we want to convert this into a `Par[List[A]]` which
is sorted:

```
def sortPar(l: Par[List[Int]]): Par[List[Int]]
```

The only combinator we have that can manipulate the value of a `Par` in any
way is `map2`. Passing the value of `l` to `map2` would gain us access to the
`List` so that we can sort it, but what about the second parameter? Well, we
can simply pass a no-op:

```
def sortPar(l: Par[List[Int]]): Par[List[Int]] =
  map2(l, unit(()))((a, _) => a.sorted)
```

Nice. We can of course "lift" any function `A => B` to become a function that
takes a `Par[A]` and returns a `Par[B]`. That is, we can `map` any function over
`Par`.

```
def map[A,B](fa: Par[A])(f: A => B): Par[B] =
  map2(fa, unit(()))((a,_) => f(a))
```

Now, would it be feasible to map over a list in parallel? So we can create a
function called `parMap` that needs to combine `n` parallel computations.

```
def parMap[A,B](l: List[A])(f: A => B): Par[List[B]]
```

Let's see how far we can get implementing this function:

```
def parMap[A,B](l: List[A])(f: A => B): Par[List[B]] = {
  val fbs: List[Par[B]] = l.map(asyncF(f))
  ...
}

```

So we have a `List[Par[B]]` now, but we really want a `Par[List[B]]`. Let's
write a function that does this, typically called `sequence`.

```
def sequence[A](l: List[Par[A]]): Par[List[A]]
```

Once we can sequence the computation, we can complete our `parMap`
implementation.

```
def parMap[A,B](l: List[A])(f: A => B): Par[List[B]] = fork {
  val fbs: List[Par[B]] = l.map(asyncF(f))
  sequence(fbs)
}
```

What other functions can we apply in parallel?

```
def parFilter[A](l: List[A])(f: A => Boolean): Par[List[A]]
```

## The algebra of an API ##

It's quite interesting to see how far we can get with symbolic manipulation, but
we have been fairly informal about how we created the API. Ideally you would
like to formalize what laws hold for your API.

You have probably already built up a mental model of this, but writing it
down will make them precise and will highlight design choices that might
not be apparent otherwise.

Like any design, choosing laws has _consequences_ - it places constraints on
what the operations can mean, what implementations are possible, affects what
other properties can be true or false, etc.

We can conjure up some possible laws that seem reasonable. This might be used
as a test case if we were creating unit test for the library:

```
map(unit(1))(_ + 1) == unit(2)
```

Laws often start like this, as concrete examples of _identities_. Laws are
like functions and can be generalized:

```
map(unit(x))(f) == unit(f(x))
```

Can you think of other laws?

## The expressiveness and the limitations of an algebra ##

Functional design is an iterative process. As you start using the API, you might
realise that there are some limitations to the API as you start using it in
more complex and realistic ways.

Try writing a function that chooses between two forking computations based on
the result of an initial computation. Can this be implemented in terms of
existing combinators or is a new primitive required?

```
def choice[A](a: Par[Boolean])(ifTrue: Par[A], ifFalse: Par[A]): Par[A]
```

Sadly not, if you used `map` you would end up with the result of
`Par[Par[A]]`. As a result we need a new combinator that will effectively
"unwrap" the structure. This function which comes up often in combinator
libraries is usually called `bind` or `flatMap`:

```
def flatMap[A,B](a: Par[A])(f: A => Par[B]): Par[B]
```
