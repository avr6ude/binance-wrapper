import { Suspense, useEffect, useRef, useState } from 'react'
import excludedPairs from 'data/excludedPairs'
import getBinanceData, { getUSDTPairs } from 'helpers/binanceApi'

interface OrderBook {
  bids: string[][]
  asks: string[][]
}

export default function () {
  const [tickerData, setTickerData] = useState<OrderBook | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [filteredPairs, setFilteredPairs] = useState<string[]>([])
  const tickerIndex = useRef(0)

  useEffect(() => {
    const fetchPairs = async () => {
      const USDTPairs = await getUSDTPairs()
      const pairs = USDTPairs.map((pair) => pair.symbol)
      const filtered = pairs.filter((pair) => !excludedPairs.includes(pair))
      setFilteredPairs(filtered)
    }

    void fetchPairs()
  }, [])

  useEffect(() => {
    const fetchPrice = async (ticker: string): Promise<OrderBook> => {
      try {
        const data = await getBinanceData(ticker, 'depth')
        return data || { bids: [], asks: [] }
      } catch (e) {
        console.error(`Error fetching price for ${ticker}: ${e}`)
        return { bids: [], asks: [] }
      }
    }

    const fetchTradeData = async (ticker: string) => {
      try {
        const trades = await getBinanceData(ticker, 'trades')
        if (trades && trades.length > 0) {
          setCurrentPrice(parseFloat(trades[0].price))
        }
      } catch (e) {
        console.error(`Error fetching trade data for ${ticker}: ${e}`)
      }
      return 0
    }

    const checkDifference = (
      ticker: string,
      tickerData: OrderBook,
      currentPrice: number
    ) => {
      if (!tickerData || currentPrice === 0) return

      const filteredBids = tickerData.bids.filter(
        ([price]) =>
          Math.abs((parseFloat(price) - currentPrice) / currentPrice) <= 0.3
      )
      const filteredAsks = tickerData.asks.filter(
        ([price]) =>
          Math.abs((parseFloat(price) - currentPrice) / currentPrice) <= 0.3
      )

      const totalBids = filteredBids.reduce(
        (total, [, qty]) => total + parseFloat(qty),
        0
      )
      const totalAsks = filteredAsks.reduce(
        (total, [, qty]) => total + parseFloat(qty),
        0
      )
      const difference =
        Math.abs(totalBids - totalAsks) / ((totalBids + totalAsks) / 2)

      if (difference > 0.5) {
        const newAlert = `${Math.round(difference * 100)}% | ${ticker}`
        setAlerts((prevAlerts) =>
          Array.from(new Set([...prevAlerts, newAlert]))
        )
      }
    }

    const fetchTickerData = async () => {
      const ticker = filteredPairs[tickerIndex.current]
      if (ticker) {
        const [data, price] = await Promise.all([
          fetchPrice(ticker),
          fetchTradeData(ticker),
        ])
        setTickerData(data)
        setCurrentPrice(price)
        checkDifference(ticker, data, price)
        tickerIndex.current = (tickerIndex.current + 1) % filteredPairs.length
      }
    }

    void fetchTickerData()

    const intervalId = setInterval(fetchTickerData, 5000)

    return () => clearInterval(intervalId)
  }, [currentPrice, filteredPairs, tickerData])

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="container mx-auto max-w-prose p-10 prose">
        <h1>Ticker Data</h1>
        {alerts.length > 0 ? (
          alerts.map((alert) => <p>{alert}</p>)
        ) : (
          <p>No alerts</p>
        )}
      </div>
    </Suspense>
  )
}
