#### To round a number to exactly 2 decimal places, avoiding common JavaScript floating point errors.

```bash
export const round2 = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100
```

#### Why use Number.EPSILON?

without EPSILON

```bash
Math.round(1.005 * 100) / 100 // ❌ Output: 1 instead of 1.01
```

#### To prevent this error
- adding Number.EPSILON (which is a very tiny number ≈ 2.220446049250313e-16) helps prevent precision errors.

```bash
Math.round((1.005 + Number.EPSILON) * 100) / 100 // ✅ Output: 1.01
```