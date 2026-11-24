# Code that doesn't lie

Most of us have read this function, or written it:

```js
function findUser(id) {
  return users[id];
}
```

The name promises a user. Ask for user 42 when there is no user 42, and you get `undefined`. Nothing in the code warns you. You find out three lines later, when `user.accountId` throws and the page goes blank.

The function lies. Not on purpose, but the lie is there all the same: it says "you will get a user" when the truth is "you might get a user."

This post is about writing code that tells the truth, and about the tool that makes truthful code pleasant to write. That tool has a name with a reputation: the monad. By the end you will see that the idea behind it is small, and that you have probably used it already.

## Step one: an honest return value

The truth about `findUser` is that the user might be missing. So let the return value say so. Instead of returning a user, return a box that either holds a user or is empty:

```js
class Maybe {
  constructor(value) { this.value = value; }
  static of(value) { return new Maybe(value); }
}

const findUser = id => Maybe.of(users[id]);
```

Now anyone who calls `findUser` gets a box, not a user. They can't read `.accountId` off a box. To get at the user, they have to look inside, and looking inside means facing the question "what if it's empty?"

## Step two: the cost of honesty

Honest code has a price. Say you need a balance, and getting it takes three lookups, each of which can come back empty:

```js
const findUser    = id      => Maybe.of(users[id]);
const findAccount = user    => Maybe.of(accounts[user.accountId]);
const findBalance = account => Maybe.of(account.balance);
```

Chaining them by hand looks like this:

```js
const user = findUser(42);
if (user.value == null) return;

const account = findAccount(user.value);
if (account.value == null) return;

const balance = findBalance(account.value);
```

Three steps, and half the lines are checks. Do this across a whole codebase and people stop bothering with boxes. They go back to returning `undefined` and hope.

## Step three: let the box do the checking

Every one of those checks says the same thing: if the box is empty, stop; if it's full, take the value out and pass it to the next step. When code repeats, we move it into one place. So we give the box a method that does exactly that:

```js
class Maybe {
  constructor(value) { this.value = value; }
  static of(value) { return new Maybe(value); }

  andThen(fn) {
    if (this.value == null) return this; // empty: skip the step
    return fn(this.value);               // full: run the step
  }
}
```

The three lookups become one line of steps:

```js
const balance = findUser(42)
  .andThen(findAccount)
  .andThen(findBalance);
```

The checks haven't gone anywhere. They live inside `andThen` now, written once instead of once per step.

## What happens when the box is empty

Suppose user 42 doesn't exist. Here is how the code runs:

```js
findUser(42)              // empty box
  .andThen(findAccount)   // box is empty: hand back the same box,
                          // findAccount never runs
  .andThen(findBalance)   // box is empty: hand back the same box,
                          // findBalance never runs
```

Nothing jumps and nothing crashes. Each `andThen` still runs, but all it does is notice the empty box and pass it along. The empty box reaches the end of the chain, and there, at the one place where you use the result, you decide what empty means:

```js
const amount = balance.value ?? 0;
```

Compare that with an exception. A `throw` leaves the code and lands in whatever `catch` sits above it, which may be in another file. With the box, the code reads top to bottom and runs top to bottom, and the handling for "missing" sits next to the line that needs it.

## When you need to know why

An empty box tells you something was missing, but not what. If the user is missing, you want to say "no user 42," not just "no balance."

The fix is the same idea with a different box: one that holds either a value or an error.

```js
class Result {
  constructor(ok, value, error) {
    this.ok = ok; this.value = value; this.error = error;
  }
  static ok(value)  { return new Result(true, value); }
  static err(error) { return new Result(false, undefined, error); }

  andThen(fn) {
    return this.ok ? fn(this.value) : this;
  }
}

const findUser = id =>
  users[id] ? Result.ok(users[id]) : Result.err(`No user ${id}`);
```

The chain looks the same as before. When a step fails, the remaining steps are skipped and the error message rides through to the end, where you can show it, log it, or turn it into an HTTP 404.

## You have already used this

Look at a `Promise`:

```js
fetch('/user/42')
  .then(res => res.json())
  .then(user => fetch(`/account/${user.accountId}`));
```

A promise is a box too. Its truth is "this value will arrive later, or the request will fail." Its `.then` is `andThen`: wait for the value, pass it to the next step, and let that step return a new box. If a request fails, the remaining `.then` steps are skipped and the failure travels down to `.catch`.

Arrays have the same shape with `flatMap`. The truth there is "there may be several values," and "and then" means "run the next step for each one and collect the results."

## So what is a monad?

A monad is a box with two operations:

1. A way to put a plain value in the box (`Maybe.of`, `Result.ok`, `Promise.resolve`).
2. An "and then" that passes the value to the next step, where that step returns a new box (`andThen`, `.then`, `flatMap`).

Each kind of box decides what "and then" means. `Maybe` skips the remaining steps when empty. `Result` skips them and carries the error. `Promise` waits. An array repeats the step for every item. There are a few rules that make the boxes behave predictably (wrapping a value and then calling `andThen` should be the same as just calling the step, for example), but if your `andThen` does the obvious thing, it will follow them.

That's all the word means. The reputation comes from where people first meet it: in Haskell, next to purity and laziness, explained in the language of category theory. Strip that away and you are left with a box and an "and then."

## The point

The box makes the code honest: the return value says what can really happen. The "and then" makes honesty cheap: you get the truth in the types without an `if` on every line.

A function that returns `Maybe<User>` can't surprise you with a missing user, because it told you up front. That's the whole goal. The monad is just what lets you keep that promise without drowning in checks.