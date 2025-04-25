## how to connect mongodb in nextjs app

this approach is taken from [link](https://github.com/vercel/next.js/tree/canary/examples/with-mongodb)

### step-1:

#### client.ts

```ts
import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

export default client;
```

This file sets up a singleton MongoDB client instance, which helps you connect to MongoDB efficiently without creating multiple connections — especially during development.

##### Why its's necessary:

In a Next.js project (especially in development mode), code can be re-evaluated many times due to hot-reloading. If you create a new MongoClient instance on every request or reload, you’ll quickly exhaust MongoDB connections, which leads to performance issues or errors.

- Prevent multiple MongoDB connections in development
- Ensure a single, reusable instance
- Allow connection settings like API versioning and deprecation warnings

## Explenation

```ts
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};
```

Sets MongoDB server API settings:

- strict: true → enforce strict commands.
- deprecationErrors: true → show errors if using deprecated features.
- Helps ensure you're using the latest best practices.

```ts
if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
}
```

In development, the Mongo client is cached globally (global.\_mongoClient) so that it isn't recreated on every hot-reload.

```ts
else {
    client = new MongoClient(uri, options)
}

```

In production, no hot-reloading, so it's safe to create a fresh client.

🟢 When to use:
Use this if you’re directly working with collections, like db.collection('users'), without Mongoose.

### 🛠️ Example usage:

```ts
import client from '@/lib/mongodb';

export async function GET() {
  const db = client.db('your-db-name');
  const users = await db.collection('users').find().toArray();
  return Response.json(users);
}
```

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
    if (cached.conn) {
        console.log(
            `✅ Using existing MongoDB connection. DB HOST: ${cached.conn.host}`
        );
        return cached.conn;
    }

    if (!MONGODB_URI) throw new Error('❌ MONGODB_URI is missing')

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: process.env.DATABASE_NAME,
    }).then((mongooseInstance) => {
        console.log(
            `✅ New MongoDB connection established. DB HOST: ${mongooseInstance.connection.host}`
        );
        return mongooseInstance.connection
    })

    cached.conn = await cached.promise

    return cached.conn
}
```

🟢 When to use:
Use this if you are using Mongoose models to interact with your MongoDB (like User.find(), new Product().save(), etc.).

### 🛠️ Example usage:

```ts
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/user';

export async function GET() {
  await connectToDatabase();
  const users = await User.find();
  return Response.json(users);
}
```

### step-2:

#### auth.config.ts

```ts
import type { NextAuthConfig } from 'next-auth';

export default {
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorized({ request, auth }: any) {
      const protectedPaths = [
        /\/checkout(\/.*)?/,
        /\/account(\/.*)?/,
        /\/admin(\/.*)?/,
      ];
      const { pathname } = request.nextUrl;
      if (protectedPaths.some((p) => p.test(pathname))) return !!auth;
      return true;
    },
  },
} satisfies NextAuthConfig;
```

request.nextUrl.pathname

- This gives the URL of the current page being accessed.
- Example: /checkout/payment or /admin/dashboard

protectedPaths

- It's a list of regular expressions.

- These match specific routes you want to protect.

- For example: (/checkout and /checkout/_
  /admin and /admin/_,
  /account and /account/\*)

auth

- Provided by NextAuth, it contains session data.
- If the user is logged in, auth will be a session object.
- If not, auth will be null.

if (protectedPaths.some(...))

- Checks if the current page path matches any protected route.
- If it does:

```ts
return !!auth; // In JavaScript/TypeScript, !! is used to convert any value into a true or false boolean.
```

- If logged in → true → allow access.
- If not logged in → false → deny access (redirect to sign-in or return 401).

If the path is not protected

```ts
return true;
```

- Anyone can access public routes (e.g., /, /about, /products)

### step-3

#### auth.ts

```ts
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from './lib/db/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from './lib/db';
import bcrypt from 'bcryptjs';

import NextAuth, { DefaultSession } from 'next-auth';
import authConfig from './auth.config';
import User from './lib/db/models/user.model';

declare module 'next-auth' {
  interface Session {
    user: {
      role: string;
    } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: '/sign-in',
    newUser: '/sign-up',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  adapter: MongoDBAdapter(client),
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          type: 'email',
        },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        await connectToDatabase();
        if (credentials == null) return null;

        const user = await User.findOne({ email: credentials.email });

        if (user && user.password) {
          const isMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (isMatch) {
            return {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        if (!user.name) {
          await connectToDatabase();
          await User.findByIdAndUpdate(user.id, {
            name: user.name || user.email!.split('@')[0],
            role: 'user',
          });
        }
        token.name = user.name || user.email!.split('@')[0];
        token.role = (user as { role: string }).role;
      }

      if (session?.user?.name && trigger === 'update') {
        token.name = session.user.name;
      }
      return token;
    },
    session: async ({ session, user, trigger, token }) => {
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = token.name;
      if (trigger === 'update') {
        session.user.name = user.name;
      }
      return session;
    },
  },
});
```

## explanation

```ts
declare module 'next-auth' {
  interface Session {
    user: {
      role: string;
    } & DefaultSession['user'];
  }
}
```
By default, NextAuth’s session.user only includes name, email, and image.
But in your project, you're also storing the user's role (like "admin" or "user") in the session.