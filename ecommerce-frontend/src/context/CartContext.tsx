import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  getCart: () => Promise<void>;
  clearCart: () => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/cart');
      setCart(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      await axios.post('/api/cart', {
        productId,
        quantity,
      });
      await getCart(); // Refresh cart
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await axios.delete(`/api/cart/${productId}`);
      await getCart(); // Refresh cart
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  useEffect(() => {
    if (user) {
      getCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    getCart,
    clearCart,
    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};