import { connectToDatabase } from "@/lib/db";
import Product, { IProduct } from "../db/models/product.model";
import { PAGE_SIZE } from "../constants";


export async function getAllCategories() {
    await connectToDatabase()
    const category = await Product.find({ isPublished: true }).distinct('category')
    return category
}

export async function getProductsForCard({
    tag,
    limit = 4,
}: {
    tag: string,
    limit?: number
}) {
    await connectToDatabase()

    // way 1
    /*
    const products = await Product.find(
        { tags: { $in: [tag] }, isPublished: true },
        {
            name: 1,
            href: { $concat: ['/product/', '$slug'] },
            image: { $arrayElemAt: ["$images", 0] },
        }
    )
        .sort({ createdAt: 'desc' })
        .limit(limit)
    return JSON.parse(JSON.stringify(products)) as {
        name: string;
        href: string;
        image: string
    }[]
    */

    // way 2
    const products = await Product.aggregate([
        {
            $match: {
                tags: { $in: [tag] },
                isPublished: true
            }
        },

        {
            $project: {
                name: 1,
                href: { $concat: ['/product/', "$slug"] },
                image: { $arrayElemAt: ["$images", 0] }
            }
        },
        { $sort: { createAt: -1 } },
        { $limit: limit }
    ])

    return JSON.parse(JSON.stringify(products)) as {
        name: string;
        href: string;
        image: string
    }[];
}

export async function getProductsByTag({
    tag,
    limit = 10,
}: {
    tag: string,
    limit?: number
}) {
    await connectToDatabase();
    const products = await Product.find({
        tags: { $in: [tag] },
        isPublished: true,
    })
        .sort({ createdAt: 'desc' })
        .limit(limit)

    return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET ONE PRODUCT BY SLUG
export async function getProductBySlug(slug: string) {
    await connectToDatabase()
    const product = await Product.findOne({ slug, isPublished: true })

    if (!product) throw new Error('Product not found')

    return JSON.parse(JSON.stringify(product)) as IProduct
}

// GET RELATED PRODUCTS: PRODUCTS WITH SAME CATEGORY
export async function getRelatedProductsByCategory({
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

    //way 1
    // const conditions = {
    //     isPublished: true,
    //     category,
    //     _id: { $ne: productId }
    // }
    // const products = await Product.find(conditions)
    //     .sort({ numSales: 'desc' })
    //     .skip(skipAmount)
    //     .limit(limit)

    // const productsCount = await Product.countDocuments(conditions)

    // return {
    //     data: JSON.parse(JSON.stringify(products)) as IProduct[],
    //     totalPages: Math.ceil(productsCount / limit),
    // }

    // way 2
    const products = await Product.aggregate([
        {
            $match: {
                isPublished: true,
                category,
                _id: { $ne: productId }
            }
        },
        {
            $sort: { numSales: -1 }
        },
        {
            $facet: {
                metadata: [{ $count: 'total', }],
                data: [{ $skip: skipAmount }, { $limit: limit }]
            }
        }
    ])
    const totalProducts = products[0]?.metadata[0]?.total || 0

    return {
        data: JSON.parse(JSON.stringify(products[0]?.data || [])) as IProduct[],
        totalPages: Math.ceil(totalProducts / limit),
    };
}