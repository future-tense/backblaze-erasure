import { gfInverse, gfMul, gfPow } from './galois';

export function vandermonde(
    x: number,
    y: number
): Buffer {

    const m = Buffer.allocUnsafe(x * y);

    let index = 0;
    for (let v = 0; v < y; v++) {
        for (let u = 0; u < x; u++) {
            m[index++] = gfPow(v, u);
        }
    }

    return m;
}

export function subMatrix(
    m: Buffer,
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number,
    width: number
): Buffer {

    const w = xmax - xmin;
    const h = ymax - ymin;
    const res = Buffer.allocUnsafe(w * h);

    let index = 0;
    for (let y = ymin; y < ymax; y++) {
        for (let x = xmin; x < xmax; x++) {
            res[index++] = m[y * width + x];
        }
    }

    return res;
}

export function invertMatrix(
    src: Buffer,
    size: number
): Buffer {

    //  initialize `dst` to identity
    const dst = Buffer.alloc(size * size);
    for (let i = 0; i < size * size; i += size) {
        dst[i++] = 1;
    }

    for (let row = 0; row < size; row++) {

        //  find pivot
        let element = src[row * size + row];
        if (element === 0) {
            for (let row2 = row + 1; row2 < size; row2++) {
                if (src[row2 * size + row]) {
                    for (let col = 0; col < size; col++) {
                        const t1 = src[row * size + col];
                        src[row * size + col] = src[row2 * size + col];
                        src[row2 * size + col] = t1;

                        const t2 = dst[row * size + col];
                        dst[row * size + col] = dst[row2 * size + col];
                        dst[row2 * size + col] = t2;
                    }
                    break;
                }
            }

            element = src[row * size + row];
            if (element === 0) {
                throw {};
            }
        }

        //  scale to unity
        const inv = gfInverse(element);
        for (let col = 0; col < size; col++) {
            src[row * size + col] = gfMul(src[row * size + col], inv);
            dst[row * size + col] = gfMul(dst[row * size + col], inv);
        }

        //  subtract from other rows
        for (let row2 = 0; row2 < size; row2++) {
            if (row2 === row) {
                continue;
            }

            let element = src[row2 * size + row];
            for (let col = 0; col < size; col++){
                src[row2 * size + col] ^= gfMul(src[row * size + col], element);
                dst[row2 * size + col] ^= gfMul(dst[row * size + col], element);
            }
        }
    }

    return dst;
}

export function multiplyMatrix(
    a: Buffer,
    ac: number,
    ar: number,
    b: Buffer,
    bc: number,
    br: number
): Buffer {

    if (ac !== br) {
        throw {};
    }

    const c = Buffer.allocUnsafe(ar * bc);

    let index = 0;
    for (let y = 0; y < ar; y++) {
        for (let x = 0; x < bc; x++) {
            let sum = 0;
            for (let i = 0; i < ac; i++) {
                sum ^= gfMul(a[y * ac + i], b[i * bc + x]);
            }

            c[index++] = sum;
        }
    }

    return c;
}
