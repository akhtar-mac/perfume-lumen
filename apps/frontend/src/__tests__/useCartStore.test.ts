import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '../store/useCartStore';

const mockProduct = {
  id: 1,
  title: 'Oud Royal',
  price: 34.99,
  image: 'oud.jpg',
};

describe('useCartStore', () => {
  beforeEach(() => {
    act(() => useCartStore.getState().clearCart());
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.getCartCount()).toBe(0);
    expect(result.current.getCartTotal()).toBe(0);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('increments quantity on duplicate add', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.addToCart(mockProduct));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.removeFromCart(1));
    expect(result.current.items).toHaveLength(0);
  });

  it('updates quantity', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.updateQuantity(1, 5));
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.updateQuantity(1, 0));
    expect(result.current.items).toHaveLength(0);
  });

  it('calculates total correctly', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.addToCart(mockProduct));
    expect(result.current.getCartTotal()).toBeCloseTo(69.98, 2);
  });

  it('calculates count correctly', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.addToCart({ ...mockProduct, id: 2 }));
    expect(result.current.getCartCount()).toBe(3);
  });

  it('clears cart', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addToCart(mockProduct));
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
  });

  it('opens and closes drawer', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.openDrawer());
    expect(result.current.isDrawerOpen).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.isDrawerOpen).toBe(false);
  });
});