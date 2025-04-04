## install zustand 

## demo of implementation
components/shared/browsing-history-list.tsx

```bash
import { create } from "zustand";
import { persist } from "zustand/middleware";

type BrowsingHistory = {
    products: {
        id: string,
        category: string
    }[]
}

const initialState: BrowsingHistory = {
    products: [],
}

export const browsingHistoryStore = create<BrowsingHistory>()(
    persist(() => initialState, {
        name: "browsingHistoryStore"
    })
)

export default function useBrowsingHistory() {
    const { products } = browsingHistoryStore()

    return {
        products,
        addItem: (product: { id: string; category: string }) => {
            const index = products.findIndex(item => item.id === product.id)
            if (index !== -1) products.splice(index, 1) // remove duplicate if it exists
            products.unshift(product)  //add id to start

            if (products.length > 10) products.pop() // remove excess items if length exceeds 10

            browsingHistoryStore.setState({
                products
            })
        },

        clear: () => {
            browsingHistoryStore.setState({
                products: []
            })
        }
    }
}
```

# use 
components/shared/browsing-history-list.tsx
```bash
import useBrowsingHistory from '@/hooks/use-browsing-history';
import React, { useEffect, useState } from 'react';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import ProductSlider from './product/product-slider';

export default function BrowsingHistoryList({
  className,
}: {
  className?: string;
}) {
  const { products } = useBrowsingHistory();

  return (
    products.length > 0 && (
      <div className='bg-background'>
        <Separator className={cn('mb-4', className)} />
        <ProductList
          title="Releted to items that you've viewed"
          type='related'
        />
      </div>
    )
  );
}

function ProductList({
  title,
  type = 'history',
  hideDetails = false,
}: {
  title: string;
  type: 'history' | 'related';
  hideDetails?: boolean;
}) {
  const { products } = useBrowsingHistory();
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(
        `/api/products/browsing-history?type=${type}&categories=${products
          .map((product) => product.category)
          .join(',')}&ids=${products.map((product) => product.id).join(',')}`
      );
      const data = await res.json();
      setData(data);
    };
    fetchProducts();
  }, [products, type]);

  return (
    data.length > 0 && (
      <ProductSlider title={title} products={data} hideDetails={hideDetails} />
    )
  );
}

```

