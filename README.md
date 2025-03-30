## connect mongodb

###### lib>db>index.ts

```bash
import mongoose, { Connection } from "mongoose";

interface MongooseGlobal {
    conn: Connection | null;
    promise: Promise<Connection> | null
}

const globalWithMongoose = global as typeof global & { mongoose?: MongooseGlobal }

if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export const connectToDatabase = async (
    MONGODB_URI = process.env.MONGODB_URI
) => {
    if (cached.conn) return cached.conn

    if (!MONGODB_URI) throw new Error('MONGODB_URI is missing')

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: process.env.DATABASE_NAME,
    }).then((mongooseInstance) => mongooseInstance.connection)

    cached.conn = await cached.promise

    return cached.conn
}
```

#### sample of write schema and export

```bash
import { Document, Model, model, models, Schema } from 'mongoose'
import { IProductInput } from '@/types'

export interface IProduct extends Document, IProductInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    images: [String],
    brand: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    listPrice: {
      type: Number,
      required: true,
    },
    countInStock: {
      type: Number,
      required: true,
    },
    tags: { type: [String], default: ['new arrival'] },
    colors: { type: [String], default: ['White', 'Red', 'Black'] },
    sizes: { type: [String], default: ['S', 'M', 'L'] },
    avgRating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    ratingDistribution: [
      {
        rating: {
          type: Number,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
      },
    ],
    numSales: {
      type: Number,
      required: true,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
)

const Product =
  (models.Product as Model<IProduct>) ||
  model<IProduct>('Product', productSchema)

export default Product

```

# access env variable in project

### public variable (process.env.NEXT_PUBLIC_APP_NAME)

### private variable

```bash
import { connectToDatabase } from "."
import products from "../Data/ProductData"
import { cwd } from "process"
import { loadEnvConfig } from "@next/env"
import Product from "./models/product.model"

loadEnvConfig(cwd())


const main = async () => {
    try {
        await connectToDatabase(process.env.MONGODB_URI)

        await Product.deleteMany()
        const createdProducts = await Product.insertMany(products)

        console.log({
            createdProducts,
            message: "Seeded database successfully",
        })
        process.exit(0)
    } catch (error) {
        console.error(error)
        throw new Error("Failed to seed database")
    }
}

main()
```

## add env variable in versel

#### step 1:

cpy all env variable together

#### step 2:

go to versel and find project inside the project -> setting -> find Environment variables past all variable together under the key input box

# Ratting component

```bash
import { Star } from 'lucide-react';
import React from 'react';

export default function Rating({
  rating = 0,
  size = 6,
}: {
  rating: number;
  size?: number;
}) {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div
      className='flex items-center'
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`w-${size} h-${size} fill-primary text-primary`}
        />
      ))}
      {partialStar > 0 && (
        <div className='relative'>
          <Star className={`w-${size} h-${size} text-primary`} />
          <div
            className='absolute top-0 left-0 overflow-hidden'
            style={{ width: `${partialStar * 100}%` }}
          >
            <Star className={`w-${size} h-${size} fill-primary text-primary`} />
          </div>
        </div>
      )}

      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`w-${size} h-${size} text-primary`}
        />
      ))}
    </div>
  );
}

```

# New Things

```bash
<Link
        href={`/product/${product.slug}`}
        className='overflow-hidden text-ellipsis'
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>
```

The text will only show two lines and will add ... if it overflows.

- Why Not Use text-overflow: ellipsis?

Usually, for single-line truncation, you'd use:

```bash
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

However, this only works for one line.
To limit text to multiple lines, -webkit-line-clamp is the best approach.

## pipeline for pagination

```bash
export async function getRelatedProducts({
    category,
    productId,
    limit = PAGE_SIZE,
    page = 1
}: {
    category: string,
    productId: string,
    limit?: number,
    page?: number
}) {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit

    # way 1
    #  const conditions = {
    #      isPublished: true,
    #      category,
    #      _id: { $ne: productId }
    #  }
    #  const products = await Product.find(conditions)
    #      .sort({ numSales: 'desc' })
    #      .skip(skipAmount)
    #      .limit(limit)

    #  const productsCount = await Product.countDocuments(conditions)

    #  return {
    #      data: JSON.parse(JSON.stringify(products)) as IProduct[],
    #      totalPages: Math.ceil(productsCount / limit),
    #  }

    # // way 2
    # যদি multi-faceted query দরকার হয়, যেখানে বিভিন্ন data set আলাদাভাবে বের করতে হবে, তাহলে $facet ভালো।
    # যখন একসাথে আলাদা আলাদা dataset দরকার।
    # যখন pagination, filtering বা sorting একাধিক query set-এ করতে হবে।
    # যখন MongoDB-তে একাধিক query মারার চেয়ে এক কোয়েরিতে result পাওয়া দরকার।



    # const products = await Product.aggregate([
    #     {
    #         $match: {
    #             isPublished: true,
    #             category,
    #             _id: { $ne: productId }
    #         }
    #     },
    #     {
    #         $sort: { numSales: -1 }
    #     },
    #     {
    #         $facet: {
    #             metadata: [{ $count: 'total', }],
    #             data: [{ $skip: skipAmount }, { $limit: limit }]
    #         }
    #     }
    # ])
    # const totalProducts = products[0]?.metadata[0]?.total || 0

    # return {
    #     data: JSON.parse(JSON.stringify(products[0]?.data || [])) as IProduct[],
    #     totalPages: Math.ceil(totalProducts / limit),
    # };

    # // way 3 (besst)
  #  যদি শুধু pagination এবং total count দরকার হয়, তাহলে $group + $project ব্যবহার করাই যথেষ্ট।
  #  Performance: বেশি ডাটা থাকলে $facet ভালো হতে পারে, তবে $group + $project লাইটওয়েট ও সহজবোধ্য।

  # 💡 কেন $facet এর পরিবর্তে $group + $project ব্যবহার করলাম?
    # $facet প্রয়োজন নেই কারণ এখানে একাধিক dataset দরকার নেই।
    # $group সব প্রোডাক্ট একত্রে এনে total count বের করতে সাহায্য করে।
    # $project ব্যবহার করে pagination efficiently handle করা যায়।

    const product = await Product.aggregate([
      {
        $match: {
          isPublished: true,
          category,
          _id: {$ne: productId}
        }
      },
      {
        $sort: {numSales: -1}
        #  data come like this formate [
        # { "_id": 1, "name": "Laptop", "numSales": 50 },
        # { "_id": 2, "name": "Phone", "numSales": 30 },
        # { "_id": 3, "name": "Tablet", "numSales": 20 },
        # { "_id": 4, "name": "Monitor", "numSales": 10 }
        # ]
      },
      {
        $group: {
          _id: null,
          total: {$sum: 1}
          data: {$push: "$$ROOT"}
        }

        # Data comes like this stage
        # [
        # {
        #   "_id": null,
        #   "total": 4,
        #   "data": [
        #     { "_id": 1, "name": "Laptop", "numSales": 50 },
        #     { "_id": 2, "name": "Phone", "numSales": 30 },
        #     { "_id": 3, "name": "Tablet", "numSales": 20 },
        #     { "_id": 4, "name": "Monitor", "numSales": 10 }
        #   ]
        # }
        # ]
      },
      {
        $project: {
          _id: 0,
          total: 1,
          data: {
            $slice: ["$data", skipamount, limit]
          }
        }
    
    # Data this stage

    # {
    #   $project: {
    #     _id: 0,
    #     total: 1,
    #     data: {
    #       $slice: ["$data", 1, 2]  // Skip 1 item, limit to 2 items
    #     }
    #   }
    # }
    # }

    ])

    # final output
    # {
    #   "total": 4,
    #   "data": [
    #     { "_id": 2, "name": "Phone", "numSales": 30 },
    #     { "_id": 3, "name": "Tablet", "numSales": 20 }
    #   ]
    # }

    const totalProducts = product[0]?.total || 0;
    const pagination = product[0]?.data || []

    return {
    data: JSON.parse(JSON.stringify(pagination)) as IProduct[],
    totalPages: Math.ceil(totalProducts / limit),
    }

}
```
