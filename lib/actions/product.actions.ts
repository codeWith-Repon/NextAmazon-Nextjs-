import { connectToDatabase } from "@/lib/db";
import Product from "../db/models/product.model";


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