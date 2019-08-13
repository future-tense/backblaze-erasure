import { invertMatrix, multiplyMatrix, vandermonde, subMatrix } from './matrix';
import { addScaledVector } from './vector';

export class ErasureCoder {

    readonly numDataShards: number;
    readonly numParityShards: number;
    readonly numShards: number;

    readonly m: Buffer;
    readonly parity: Buffer;

    public constructor(
        numDataShards: number,
        numParityShards: number
    ) {
        const numShards = numDataShards + numParityShards;

        const v = vandermonde(numDataShards, numShards);
        const t = subMatrix(v, 0, 0, numDataShards, numDataShards, numDataShards);
        const inv = invertMatrix(t, numDataShards);

        const m = multiplyMatrix(v, numDataShards, numShards, inv, numDataShards, numDataShards);
        const parity = subMatrix(m, 0, numDataShards, numDataShards, numShards, numDataShards);

        this.numDataShards = numDataShards;
        this.numParityShards = numParityShards;
        this.numShards = numShards;

        this.m = m;
        this.parity = parity;
    }

    public encode(
        input: Buffer[],
        output: Buffer[]
    ): void {
        encodeShards(this.parity, input, output);
    }

    public reconstruct(
        dataShards: (Buffer | null)[],
        parityShards: (Buffer | null)[]
    ): void {

        const numDataShards = this.numDataShards;

        const missingShards: number[] = [];
        let numMissingShards = 0;
        for (let i = 0; i < numDataShards; i++) {
            const shard = dataShards[i];
            if (shard === null) {
                numMissingShards++;
                missingShards.push(i);
            }
        }

        if (!numMissingShards) {
            return;
        }

        if (numMissingShards > this.numParityShards) {
            throw {};
        }

        const shards    = dataShards.concat(parityShards);

        const parity    = getParity(this.m, shards, missingShards, numDataShards);
        const subShards = getSubShards(shards, numDataShards);
        const output    = getOutput(subShards, missingShards);
        encodeShards(parity, subShards, output);

        for (let i = 0; i < numMissingShards; i++) {
            const index = missingShards[i];
            dataShards[index] = output[i];
        }
    }
}

function getParity(
    m: Buffer,
    shards: (Buffer | null)[],
    missingShards: number[],
    numDataShards: number
): Buffer {

    const subMatrixRows: Buffer[] = [];
    let index = 0;
    let numRows = 0;

    for (let i = 0; numRows < numDataShards; i++) {
        const shard = shards[i];
        if (shard !== null) {
            const row = m.slice(index, index + numDataShards);
            subMatrixRows.push(row);
            numRows++;
        }

        index += numDataShards;
    }

    const subMatrix = Buffer.concat(subMatrixRows);
    const parity = invertMatrix(subMatrix, numDataShards);

    for (let i = 0; i < missingShards.length; i++) {
        const index = missingShards[i] * numDataShards;
        const row = parity.slice(index, index + numDataShards);
        row.copy(parity, i * numDataShards);
    }

    return parity;
}

function getSubShards(
    shards: (Buffer | null)[],
    size: number
): Buffer[] {

    return shards
        .filter(item => item !== null)
        .slice(0, size) as Buffer[];
}

function getOutput(
    subShards: Buffer[],
    missingShards: number[]
): Buffer[] {

    const numBytes = subShards[0].length;
    return missingShards.map(x => Buffer.alloc(numBytes));
}

function encodeShards(
    parity: Buffer,
    input: Buffer[],
    output: Buffer[]
): void {

    let parityIndex = 0;
    const numBytes = input[0].length;
    for (const dstShard of output) {
        for (const srcShard of input) {
            const t = parity[parityIndex++];
            addScaledVector(dstShard, srcShard, t, numBytes);
        }
    }
}
