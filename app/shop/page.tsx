import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getProducts(category?: string, search?: string) {
  return await prisma.product.findMany({
    where: {
      AND: [
        category ? { category: { slug: category } } : {},
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        { inStock: true },
      ],
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const products = await getProducts(searchParams.category, searchParams.search);
  const categories = await getCategories();

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white border rounded-2xl p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Categories</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/shop"
                className={`px-3 py-2 rounded-lg transition ${!searchParams.category ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className={`px-3 py-2 rounded-lg transition ${searchParams.category === cat.slug ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t">
              <h3 className="font-bold text-lg mb-4">Search</h3>
              <form action="/shop" method="GET" className="flex gap-2">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchParams.search || ''}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                  Find
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {searchParams.category ? 'Category' : searchParams.search ? 'Search Results' : 'All Products'}
            </h1>
            <p className="text-gray-500">{products.length} products found</p>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border rounded-3xl p-12 text-center">
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              <Link href="/shop" className="text-blue-600 hover:underline mt-4 inline-block">View all products</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="group">
                  <div className="bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition">
                    <div className="aspect-square relative bg-gray-100">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                      <h3 className="font-bold text-lg group-hover:text-blue-600 transition">{product.name}</h3>
                      <p className="text-blue-600 font-bold mt-2">${Number(product.price).toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
