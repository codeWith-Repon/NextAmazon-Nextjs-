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
