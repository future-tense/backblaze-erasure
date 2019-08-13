
const ErasureCoder = require('./lib').ErasureCoder;
const e = new ErasureCoder(3, 2);

// -----------------------------------------------------------------------------

const input = [
    Buffer.from([0, 1, 2, 3]),
    Buffer.from([4, 5, 6, 7]),
    Buffer.from([8, 9, 10, 11])
];

const output = [
    Buffer.alloc(4),
    Buffer.alloc(4)
];

e.encode(input, output);

// -----------------------------------------------------------------------------

input[0] = null;
input[2] = null;
e.reconstruct(input, output);
console.log(input);

// -----------------------------------------------------------------------------
