# Functor

Anything that can be mapped over.

[1, 2, 3].map(x => )

map(fn)

Map takes a function

## Wrappers

Values can be wrapped into some kind of shape.

An array is simply a collection of values after each other:

[1, 2, 3]

An object is also a collection of values, with names, or keys

{ age: 35, name: "tjaard" }

## Map

Mapping something projects it into new values, but of the same shape.

You provide a projection function.

For example, plus one to each value in the array:

[1, 2, 3].map(x => x + 1) = [2, 3, 4]

Or, make me a wizard:

{ age: 35, name: "tjaard" }.map(x => { age: 80, name: "samutjaard" })

The shape must stay, but the type can change:

[1, 2, 3].map(x => x.toString()) = ["1", "2", "3"]

## Functor laws

Identity

functor.map(x => x) = functor
[1, 2, 3].map(x => x) = [1, 2, 3]

- https://medium.com/@dtinth/what-is-a-functor-dcf510b098b6
- https://jrsinclair.com/articles/2016/marvellously-mysterious-javascript-maybe-monad