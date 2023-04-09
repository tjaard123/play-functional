const fs = require('fs');

// A function that returns an object, with a map function
let Just = (val) => {
  return {
    // The map function returns another object by calling Just, that also has a map function
    // It executes the function provided to map on the value first
    map: f => Just(f(val)),
    reduce: (f, x0) => f(x0, val)
  }
};

// Get token
// Get user

var one = Just(1);
console.log(one);
var two = one.map(x => x + 1);
console.log(two);

let Nothing = () => {
  return {
    map: () => nothing,
    reduce: (_, x0) => x0
  };
}

let getFile = (file) => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return Just(data);
  } catch (err) {
    return Nothing();
  }
}

let fileExist = getFile("monads.md");
let fileNotExist = getFile("nothing.md");

getFile("monads.md")
  .map(x => x[0])
  .map(x => {
    console.log(x);
    return x.toUpperCase();
  });

// fileExist.map(x => console.log(x));



// const reduce = (f, x0) => foldable => foldable.reduce(f, x0);

// reduce((_, val) => val, "NOTHING");

// console.log(fileExist.reduce());
// console.log(fileNotExist);


// const Nothing = () => {
//   const nothing = { map: () => nothing };
//   return nothing;
// };

// let getKey = (key) => {
//   let item = localStorage.getItem(key);
//   if (item) {
//     return Just(item);
//   }
//   else {
//     return Nothing;
//   }
// }

// getKey("TOKEN")