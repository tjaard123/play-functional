# [Learn you a Haskell](http://learnyouahaskell.com/starting-out)

Basics is pretty straight forward if you're use to F#... skipped through this until it gets interesting...

## [Texas ranges](http://learnyouahaskell.com/starting-out#texas-ranges)

Powerful way to initialize a consecutive set, you can even provide a step.

```haskell
[1..10]
```

Haskell can do infinites, etc. cycle [1,2,3] infinitely

You can do incredible things with list comprehensions:

```haskell
boomBangs xs = [ if x < 10 then "BOOM!" else "BANG!" | x <- xs, odd x]
boomBangs [7..13]
["BOOM!","BOOM!","BANG!","BANG!"]
length' xs = sum [1 | _ <- xs] 
```

Basically you can provide a map and filter function inline `[MAP | INPUT, FILTER]`:

```haskell
removeUppercase str = [x | x <- str, elem x ['a'..'z']]
removeUppercase "Hello"
"ello"

addOne str = [x + 1 | x <- str]
```

## [Tuples](http://learnyouahaskell.com/starting-out#tuples)

```haskell
("Tjaard", "Du Plessis", 32)
```

## [Types](http://learnyouahaskell.com/types-and-typeclasses)

Type inference, use :t to see type.

```Haskell
:t head
head :: [a] -> a
```

a is a type variable, head is a polymorphic function that works on any type

## Typeclasses

Like an interface in OOP, but better.  Not a class.

```haskell
:t (==)  
(==) :: (Eq a) => a -> a -> Bool 
```

Eq is a typeclass.

Don't entirely get this one yet, nudging a little further to see how it's used.

## [Functions](http://learnyouahaskell.com/syntax-in-functions)

Pattern matching is like a case on steroids

```haskell
factorial :: (Integral a) => a -> a
factorial 0 = 1
factorial n = n * factorial (n - 1)
```