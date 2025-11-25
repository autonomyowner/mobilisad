import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase/client'
import { SellerOrder } from '../services/supabase/sellerService'

interface UseRealtimeOrdersOptions {
  sellerId: string
  enabled?: boolean
}

interface UseRealtimeOrdersResult {
  orders: SellerOrder[]
  pendingCount: number
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export const useRealtimeOrders = ({
  sellerId,
  enabled = true,
}: UseRealtimeOrdersOptions): UseRealtimeOrdersResult => {
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Calculate pending count from orders
  const pendingCount = orders.filter(order => order.status === 'pending').length

  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled || !sellerId) {
      return
    }

    // Initial fetch
    fetchOrders()

    // Set up real-time subscription
    const channel = supabase
      .channel(`seller-orders-${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          console.log('Order change received:', payload)

          if (payload.eventType === 'INSERT') {
            // New order created
            setOrders((current) => [payload.new as SellerOrder, ...current])
          } else if (payload.eventType === 'UPDATE') {
            // Order updated
            setOrders((current) =>
              current.map((order) =>
                order.id === payload.new.id ? (payload.new as SellerOrder) : order
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // Order deleted
            setOrders((current) =>
              current.filter((order) => order.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [sellerId, enabled])

  return {
    orders,
    pendingCount,
    loading,
    error,
    refetch: fetchOrders,
  }
}
