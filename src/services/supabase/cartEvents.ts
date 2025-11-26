type CartEventListener = () => void

class CartEventEmitter {
  private listeners: Set<CartEventListener> = new Set()

  subscribe(listener: CartEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  emit(): void {
    this.listeners.forEach(listener => listener())
  }
}

export const cartEvents = new CartEventEmitter()
