// Say we want to square multiple times
//
let square = (n) => { return n * n; }

console.log(square(square(2)));

// Let's introduce side effects, where we log the current number
//
let squareAndLog = (n) => {
  console.log(`squaring ${n}`);
  return n * n;
}

console.log(squareAndLog(squareAndLog(2)));

// To avoid side effects, we have to output the logs. The function is now pure
//
let squareAndLog_Pure = (n, logs) => {
  logs += ` squaring ${n} `;
  // Note that we have to wrap the output
  return [n * n, logs];
}

// But now we can't chain it anymore, because the input and output isn't of the same type
//
// ERROR: console.log(squareAndLog_Pure(squareAndLog_Pure(2, "")));

// We could write another function, to compose the two
//
let compose = (fn1, fn2, n) => {
  // Output is deconstructed (unwrapped)
  let [nSquared, logs] = squareAndLog_Pure(n, "");
  // Then we can pass the unwrapped version to the second function
  return squareAndLog_Pure(nSquared, logs);
}

console.log(compose(squareAndLog_Pure, squareAndLog_Pure, 2));

// But what if we want to square it 3 times?
//

let squareAndLog_Pure_v2 = (n, logs) => {
  logs = `squaring ${n}`;
  // Note that we have to wrap the output
  return [n * n, logs];
}

// Bind unwraps, composes and wraps again
//
let bind = (fn, inputWrapped) => {
  // Unwrap input
  let [n_in, logs_in] = inputWrapped;
  // Apply the function to the unwrapped input
  let response = fn(n_in, logs_in);
  // Unwrap response
  let [n_out, logs_out] = response;
  // Compose output, and wrap again
  return [n_out, `${logs_in}, ${logs_out}`];
}

let unit = (n) => { return [n, ""]; }

console.log(`unit(2): ${JSON.stringify(unit(2))}`);
console.log(`bind(squareAndLog_Pure_v2, unit(2)): ${JSON.stringify(bind(squareAndLog_Pure_v2, unit(2)))}`);
console.log(bind(squareAndLog_Pure_v2, bind(squareAndLog_Pure_v2, unit(2))));

let x3 =
  bind(squareAndLog_Pure_v2,
    bind(squareAndLog_Pure_v2,
      bind(squareAndLog_Pure_v2, unit(2))));

console.log(x3);