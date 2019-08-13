export let gfLog: number[];
export let gfExp: number[];

export function gfInverse(x: number): number {
    return gfExp[255 - gfLog[x]];
}

export function gfMul(
    a: number,
    b: number
): number {

    const index = gfLog[a] + gfLog[b];
    return gfExp[index % 255];
}

export function gfPow(
    a: number,
    n: number
): number {

    if (n === 0) {
        return 1;
    }

    if (a === 0) {
        return 0;
    }

    const index = gfLog[a] * n;
    return gfExp[index % 255];
}

function init(): void {
    gfLog = new Array(256);
    gfExp = new Array(256);

    let x = 1;
    for (let i = 0; i < 256; i++) {
        gfLog[x] = i;
        gfExp[i] = x;

        x *= 2;
        if (x >= 256) {
            x ^= 29;
            x &= 255;
        }
    }

    gfLog[1] = 0;
}

init();
