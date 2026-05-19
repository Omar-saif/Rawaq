import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product) return null;

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
      inStock: true,
    },
    take: 4,
  });

  return { product, relatedProducts };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProduct(params.slug);

  if (!data) notFound();

  const { product, relatedProducts } = data;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Product Image */}
        <div className="w-full md:w-1/2">
          <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden border">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div>
            <Link href={`/shop?category=${product.category.slug}`} className="text-blue-600 font-medium hover:underline">
              {product.category.name}
            </Link>
            <h1 className="text-4xl font-bold mt-2">{product.name}</h1>
            <p className="text-3xl font-bold text-blue-600 mt-4">${Number(product.price).toFixed(2)}</p>
          </div>

          <div className="prose text-gray-600">
            <p>{product.description || 'No description provided for this product.'}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </div>
          </div>

          <AddToCartButton product={product} />
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((rel) => (
            <Link key={rel.id} href={`/product/${rel.slug}`} className="group">
              <div className="bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition">
                <div className="aspect-square relative bg-gray-100">
                  {rel.image ? (
                    <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg group-hover:text-blue-600 transition">{rel.name}</h3>
                  <p className="text-blue-600 font-bold mt-2">${Number(rel.price).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
