# Monad

WIP



## Monads, is a pattern

- A coding pattern, an opinionated way to deal with a common scenario.
- Like dependency injection is a pattern to make your dependencies explicit.
- The pattern has been adopted and built into some languages, just like dependency injection.

## Behind every pattern is an opinion

The pattern builds on an opinion on how good code should be written.

Dependency injection's opinion is that an object shouldn't have a dependency built in, it should be injected by the creator.

Behind Mondads, you'll find standard functional programming opinions:
- Functions should not have side effects. Functions should be pure, the same input, always produces the same output.
- We don't want to mutate state in memory, because a function will then provide different results based on the state.
- We want better ways to handle null values, or errors

## The opinion provides constraints

The opinion is that functions should be pure. Because that makes them predictable, and leads to better code.

But that's quite a large constraint, if functions can't have side effects, how do we deal with it?

> This is the reason for the Monad pattern

## More than side effect

Turns out, the pattern isn't only useful for side effects. It's useful to deal with other constraints that our functional programming opinion introduces.

- To compose functions that has side effects
- To deal with things that could have a value, or could be null, or could have an error
- To deal with asynchronus side effects (E.g. http gets)

## An example of the pattern

Here's an example of the pattern in [JavaScript](./monad.js). Explore it now or at the end...

Instead of having a function execute a side effect, the side effect is explicitly stated, and results returned to handle by the caller.

```js
// Without a Monad
// The side effect is hidden
//
let squareWithSideEffect = (n) => {
  console.log(`squaring ${n}`);
  return n * n;
}

// Monad pattern
// No side effect, side effect returned to caller, to be handled
//
let squareAndLog_Pure = (n, logs) => {
  logs += ` squaring ${n} `;
  return [n * n, logs];
}
```

## Side effects are output

Do you see it? Your side effect becomes an OUTPUT. It also changes your INPUT.

Because functional programming avoids side effects, functions naturally requires more (larger) input, and more output.

We wanted to just return the answer, but we have to return the answer, plus side effect. The caller can decide when and how to run the side effect.

## Wrap the result

When you return more than one thing, you usually want to wrap the result.

- I am returning the answer and a log (side effect)
- I am returning the answer or an error (Either Monad)
- I am returning the answer or nothing (Maybe Monad)

But wrapping the result now makes things clunky, and difficult to compose or chain two functions together.

The Monad pattern is a way to deal with this.

Now study the [JavaScript](./monad.js) example...

## Resources

- https://jordanmartinez.github.io/purescript-jordans-reference-site/content/21-Hello-World/02-Effect-and-Aff/src/03-Aff/01-Basics/01-Launching-Aff-ps.html
- https://stackoverflow.com/questions/44965/what-is-a-monad
- https://en.wikibooks.org/wiki/Haskell/Understanding_monads/State
- https://medium.com/@bobbypriambodo/monads-in-functional-programming-a-practical-note-53488f94b20c
- https://www.continuum.be/en/blog/a-gentle-introduction-to-monads/

---

## WORK IN PROGRESS & NOTES...

Why is this pattern useful for functional programming?
- Because functions remain pure, side effects are output (explicit)
- Functions can be composed, side effects are composed as well

Now for an async example...

```js
var fetchPost = (postId) => {
  fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
    .then((response) => response.json())
    .then((json) => console.log(json));
}

var fetchUser = (userId) => {
  fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
    .then((response) => response.json())
    .then((json) => console.log(json));
}

var composeFetches = (fetch1, fetch2) => {
  fetch1(1)
    .then(post => fetch2(post.userId))
    .then(user => user.name)
}

var userNameOfPost1 = fetchAll(fetchPosts(1), fetchUser(?));
```

? Way to compose functions which have side effects
? Eliminate callback hell?
? Almost like a then?


*Monadic function: Function with a single argument*
This isn't really important...

Rules engine example

```js
const combine = (fs, input, state) => {
	if (fs.length == 1) {
		return fs[0](input, args, state);
	} else {
		return combine(fs.slice(1), input, state);
	}
};

const allCaps = (input, args, state) => {
	if (input.toUpperCase() != input) {
		return [...state, { rule: "allCaps", valid: false, message: "Must be all caps" }];
	} else {
		return [...state, { rule: "allCaps", valid: true }];
	}
};

const startWith = (input, args, state) => {
	if (input[0] != c) {
		return [...state, { rule: "startWith", valid: false, message: `Must start with ${c}` }];
	} else {
		return [...state, { rule: "startWith", valid: true }];
	}
};

// Compose an array of functions
var result = combine([allCaps, startWith], "tjaard", []);
console.log(result);
```

```js
// Recursively combine multiple rule functions in an array
// Send the input value to all rule functions
// Pass the state to all rule functions to build a final list of validations
const combine = (fs) => (input) => (state) => {
	if (fs.length == 1) return fs[0](input)(state);
	else {
		const state1 = fs[0](input)(state);
		return combine(fs.slice(1))(input)(state1);
	}
};

const length = (l) => (input) => (state) => {
	if (input.length != l) {
		return [...state, { rule: "length", valid: false, message: `Length must be ${l}` }];
	} else {
		return [...state, { rule: "length", valid: true }];
	}
};

const allCaps = (input) => (state) => {
	if (input.toUpperCase() != input) {
		return [...state, { rule: "allCaps", valid: false, message: "Must be all caps" }];
	} else {
		return [...state, { rule: "allCaps", valid: true }];
	}
};

const startWith = (c) => (input) => (state) => {
	if (input[0] != c) {
		return [...state, { rule: "startWith", valid: false, message: `Must start with ${c}` }];
	} else {
		return [...state, { rule: "startWith", valid: true }];
	}
};

var validate = combine([length(3), allCaps, startWith('x')]);

var validationResult = validate("AAA")([]);
var validationResult2 = validate("AAAa")([]);

console.log(validationResult);
console.log(validationResult2);
```