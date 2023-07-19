import { Suspense, useEffect, useState } from 'react'
import getBinanceData from 'helpers/binanceApi'

interface OrderBook {
  bids: string[][]
  asks: string[][]
}

export default function () {
  const [tickerData, setTickerData] = useState<OrderBook | null>(null)
  const [alert, setAlert] = useState('')
  const [currentPrice, setCurrentPrice] = useState(0)

  const ticker = 'BTCUSDT'

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await getBinanceData(ticker, 'depth')
        setTickerData(data)
      } catch (e) {
        console.error(`Error fetching price for ${ticker}: ${e}`)
      }
    }

    const fetchTradeData = async () => {
      try {
        const trades = await getBinanceData(ticker, 'trades')
        if (trades && trades.length > 0) {
          setCurrentPrice(parseFloat(trades[0].price))
        }
      } catch (e) {
        console.error(`Error fetching trade data for ${ticker}: ${e}`)
      }
    }

    const checkDifference = () => {
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
        setAlert(`${Math.round(difference * 100)}% | ${ticker}`)
      } else if (difference <= 0.5) {
        setAlert('')
      }
    }

    void fetchPrice()
    void fetchTradeData()
    checkDifference()

    const intervalId = setInterval(() => {
      void fetchPrice()
      void fetchTradeData()
      checkDifference()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [currentPrice, tickerData])

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="container mx-auto max-w-prose p-10 prose">
        <h1>Ticker Data</h1>
        {alert && <p>{alert}</p>}
      </div>
    </Suspense>
  )
}
