import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { Suspense, memo, useCallback, useEffect, useRef, useState } from 'react'
import excludedPairs from 'data/excludedPairs'
import getBinanceData, { getUSDTPairs } from 'helpers/binanceApi'

interface OrderBook {
  bids: string[][]
  asks: string[][]
}

const AlertItem = memo(({ index, data }: ListChildComponentProps) => (
  <p>{data[index]}</p>
))

export default function () {
  const [tickerData, setTickerData] = useState<OrderBook | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [filteredPairs, setFilteredPairs] = useState<string[]>([])
  const tickerIndex = useRef(0)

  const fetchPairs = async () => {
    const USDTPairs = await getUSDTPairs()
    const pairs = USDTPairs.map((pair) => pair.symbol)
    const filtered = pairs.filter((pair) => !excludedPairs.includes(pair))
    setFilteredPairs(filtered)
  }

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

  const fetchTickerData = useCallback(async () => {
    const ticker = filteredPairs[tickerIndex.current]
    let newAlerts = [...alerts]
    if (ticker) {
      const [data, price] = await Promise.all([
        fetchPrice(ticker),
        fetchTradeData(ticker),
      ])
      setTickerData(data)
      setCurrentPrice(price)
      tickerIndex.current = (tickerIndex.current + 1) % filteredPairs.length

      if (!data || price === 0) return

      const filteredBids = data.bids.filter(
        ([price]) =>
          Math.abs((parseFloat(price) - currentPrice) / currentPrice) <= 0.3
      )
      const filteredAsks = data.asks.filter(
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
        newAlerts = Array.from(new Set([...newAlerts, newAlert]))
      }
    }
    setAlerts(newAlerts)
  }, [filteredPairs, alerts, currentPrice])

  useEffect(() => {
    void fetchPairs()
  }, [])

  useEffect(() => {
    if (filteredPairs.length > 0) {
      const intervalId = setInterval(fetchTickerData, 60 * 60 * 1000)
      return () => clearInterval(intervalId)
    }
  }, [filteredPairs, fetchTickerData])

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="container mx-auto max-w-prose p-5 prose">
        <h1>Ticker Data</h1>
        <Suspense fallback={<p>Loading ticker data...</p>}>
          {alerts.length > 0 ? (
            <List
              height={500}
              itemSize={35}
              itemCount={alerts.length}
              itemData={alerts}
              width="100%"
            >
              {AlertItem}
            </List>
          ) : (
            <p> No alerts</p>
          )}
        </Suspense>
      </div>
    </Suspense>
  )
}
