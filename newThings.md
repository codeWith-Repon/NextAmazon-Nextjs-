## if google authentication problem appears see this

[link](https://youtu.be/WLHCPwqHzzQ?t=11586)

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

### error hendeleing

```bash
'use client';
import { Button } from '@/components/ui/button';
import useCartStore from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { OrderItem } from '@/types';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function AddToCart({
  item,
  minimal = false,
}: {
  item: OrderItem;
  minimal?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const { addItem } = useCartStore();

  return minimal ? (
    <Button
      className='rounded-full w-auto'
      onClick={() => {
        try {
          addItem(item, 1);
          toast({
            description: 'Item added to cart',
            action: (
              <Button
                onClick={() => {
                  router.push('/cart');
                }}
              >
                Go to cart
              </Button>
            ),
          });
        } catch (error: unknown) {
          const err = error as Error;
          toast({
            variant: 'destructive',
            description: err.message,
          });
        }
      }}
    >
      Add to Cart
    </Button>
  ) : (
    <div className=''></div>
  );
}
```

### toast & if want to use any you must specify top of the file

/_ eslint-disable @typescript-eslint/no-explicit-any _/

```bash
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useCartStore from '@/hooks/use-cart-store';
import { useToast } from '@/hooks/use-toast';
import { OrderItem } from '@/types';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function AddToCart({
  item,
  minimal = false,
}: {
  item: OrderItem;
  minimal?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const { addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);

  return minimal ? (
    <Button
      className='rounded-full w-auto'
      onClick={() => {
        try {
          addItem(item, 1);
          toast({
            description: 'Item added to cart',
            action: (
              <Button
                onClick={() => {
                  router.push('/cart');
                }}
              >
                Go to cart
              </Button>
            ),
          });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            description: error.message,
          });
        }
      }}
    >
      Add to Cart
    </Button>
  ) : (
    <div className='w-full space-y-2'>
      <Select
        value={quantity.toString()}
        onValueChange={(i) => setQuantity(Number(i))}
      >
        <SelectTrigger>
          <SelectValue> Quantity: {quantity}</SelectValue>
        </SelectTrigger>
        <SelectContent position='popper'>
          {Array.from({ length: item.countInStock }).map((_, i) => (
            <SelectItem key={i + 1} value={`${i + 1}`}>
              {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        className='rounded w-full'
        type='button'
        onClick={async () => {
          try {
            const itemId = await addItem(item, quantity);
            router.push(`/cart/${itemId}`);
          } catch (error: any) {
            toast({
              variant: 'destructive',
              description: error.message,
            });
          }
        }}
      >
        Add to Cart
      </Button>

      <Button
        variant='secondary'
        onClick={() => {
          try {
            addItem(item, quantity);
            router.push(`/checkout`);
          } catch (error: any) {
            toast({
              variant: 'destructive',
              description: error.message,
            });
          }
        }}
      >
        Buy Now
      </Button>
    </div>
  );
}

```

#### catch dynamic parms

app/(root)/cart/[itemId]/page.tsx

```tsx
import React from 'react';
import CartAddItem from './cart-add-item';

export default async function CartAddItemPage(props: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await props.params;
  return <CartAddItem itemId={itemId} />;
}
```

#### buttonVarient

- This function comes from shadcn/ui
- So when call buttonVariants(), it returns a default button style string, like:

```bash
"inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-md text-sm font-medium"
```

- These are your default button styles, which make the link look like a button.
- You're manually adding extra styles: 'rounded-full w-full'

```tsx
  <Link
                  href='/checkout'
                  className={cn(buttonVariants(), 'rounded-full w-full')}
                >
                  Proceed to checkout (
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items )
                </Link>
                <Link
                  href='/cart'
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'rounded-full w-full'
                  )}
                >
```

when run this command $ npx auth secret. It's autometically update .env.local fille don't need to warry about this
