'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types/product';
import { products as initialProducts } from '@/data/products';
import toast from 'react-hot-toast';
import { addToCartMessages, removeFromCartMessages, getRandomMessage } from '@/utils/toastMessages';
import { en } from '@/translations/en';
import { sk } from '@/translations/sk';
import { de } from '@/translations/de';

type Language = 'en' | 'sk' | 'de';

interface StoreState {
  products: Product[];
  cart: CartItem[];
  isDarkMode: boolean;
  isSideMenuExpanded: boolean;
  isAdminAuthenticated: boolean;
  language: Language;
  translations: typeof en;
  addProduct: (product: Product) => void;
  editProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  duplicateProduct: (product: Product) => void;
  reorderProducts: (products: Product[]) => void;
  toggleProductVisibility: (product: Product) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDarkMode: () => void;
  toggleSideMenu: () => void;
  setAdminAuthenticated: (value: boolean) => void;
  setLanguage: (lang: Language) => void;
}

const translations = {
  en,
  sk,
  de
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: initialProducts,
      cart: [],
      isDarkMode: false,
      isSideMenuExpanded: true,
      isAdminAuthenticated: false,
      language: 'en',
      translations: en,

      addProduct: (product) =>
        set((state) => {
          const newProducts = [...state.products, product];
          updateProductsFile(newProducts);
          return { products: newProducts };
        }),

      editProduct: (product) =>
        set((state) => {
          const newProducts = state.products.map((p) =>
            p.id === product.id ? product : p
          );
          updateProductsFile(newProducts);
          return { products: newProducts };
        }),

      deleteProduct: (productId) =>
        set((state) => {
          const newProducts = state.products.filter((p) => p.id !== productId);
          const newCart = state.cart.filter((item) => item.id !== productId);
          updateProductsFile(newProducts);
          return {
            products: newProducts,
            cart: newCart,
          };
        }),

      duplicateProduct: (product) =>
        set((state) => {
          const duplicatedProduct = {
            ...product,
            id: Date.now().toString(),
            name: `${product.name} (Copy)`,
          };
          const newProducts = [...state.products, duplicatedProduct];
          updateProductsFile(newProducts);
          return { products: newProducts };
        }),

      reorderProducts: (products) =>
        set((state) => {
          updateProductsFile(products);
          return { products };
        }),

      toggleProductVisibility: (product) =>
        set((state) => {
          const newProducts = state.products.map((p) =>
            p.id === product.id ? { ...p, hidden: !p.hidden } : p
          );
          updateProductsFile(newProducts);
          return { products: newProducts };
        }),

      addToCart: (product) =>
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === product.id);
          const donation = (product.price * 0.1).toFixed(2);
          
          toast.success(
            `${getRandomMessage(addToCartMessages)} (+€${donation} to shelter 💝)`,
            {
              duration: 3000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid #dcfce7',
              },
            }
          );
          
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] };
        }),

      removeFromCart: (productId) =>
        set((state) => {
          const item = state.cart.find((i) => i.id === productId);
          if (item) {
            const lostDonation = (item.price * item.quantity * 0.1).toFixed(2);
            toast.error(
              `${getRandomMessage(removeFromCartMessages)} (-€${lostDonation} lost from shelter 💔)`,
              {
                duration: 3000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid #fee2e2',
                },
              }
            );
          }
          return {
            cart: state.cart.filter((item) => item.id !== productId),
          };
        }),

      updateCartItemQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        })),

      clearCart: () => set({ cart: [] }),

      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      toggleSideMenu: () =>
        set((state) => ({ isSideMenuExpanded: !state.isSideMenuExpanded })),

      setAdminAuthenticated: (value: boolean) =>
        set({ isAdminAuthenticated: value }),

      setLanguage: (lang: Language) =>
        set({ language: lang, translations: translations[lang] }),
    }),
    {
      name: 'snack-shop-storage',
      partialize: (state) => ({
        isAdminAuthenticated: state.isAdminAuthenticated,
        isDarkMode: state.isDarkMode,
        cart: state.cart,
        language: state.language,
      }),
    }
  )
);

async function updateProductsFile(products: Product[]) {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });
    
    if (!response.ok) {
      console.error('Failed to update products file');
    }
  } catch (error) {
    console.error('Error updating products file:', error);
  }
}