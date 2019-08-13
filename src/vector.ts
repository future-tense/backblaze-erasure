import { gfExp, gfLog } from './galois';

export function addScaledVector(
    dest: Buffer,
    src: Buffer,
    scalar: number,
    size: number
): void {

    const log = gfLog[scalar];
    for (let i = 0; i < size; i++) {
        const index = log + gfLog[src[i]];
        dest[i] ^= gfExp[index % 255];
    }
}

