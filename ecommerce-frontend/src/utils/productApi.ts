import axios from 'axios';

export interface ProductRecord {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt?: string;
  seller?: string | { _id: string };
}

interface ProductsResponse {
  products: ProductRecord[];
  pages?: number;
}

export const fetchAllProducts = async (): Promise<ProductRecord[]> => {
  const limit = 100;
  const firstResponse = await axios.get<ProductsResponse>('/api/products', {
    params: {
      page: 1,
      limit,
    },
  });

  const firstProducts = firstResponse.data.products ?? [];
  const totalPages = Math.max(firstResponse.data.pages ?? 1, 1);

  if (totalPages === 1) {
    return firstProducts;
  }

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => (
      axios.get<ProductsResponse>('/api/products', {
        params: {
          page: index + 2,
          limit,
        },
      })
    ))
  );

  return [
    ...firstProducts,
    ...remainingResponses.flatMap((response) => response.data.products ?? []),
  ];
};

export const getProductSellerId = (product: Pick<ProductRecord, 'seller'>) => {
  if (!product.seller) {
    return null;
  }

  return typeof product.seller === 'string' ? product.seller : product.seller._id;
};
