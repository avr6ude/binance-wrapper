import { Suspense, useEffect, useMemo, useState } from 'react'
import ReactFrappeChart from 'react-frappe-charts'
import env from 'helpers/env'
import getBinanceData from 'helpers/binanceApi'
import getTickerData, { getTradeData } from 'helpers/binanceApi'
interface TickerData {
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
}

interface OrderBook {
  lastUpdatedId: number
  bids: string[][]
  asks: string[][]
}

export default function () {
  const [tickerData, setTickerData] = useState<OrderBook | null>(null)
  const [alert, setAlert] = useState('')
  const [overCount, setOverCount] = useState(0)
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

    void fetchPrice()
    void fetchTradeData()

    const intervalId = setInterval(fetchPrice, 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
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
        setOverCount((count) => count + 1)
        setAlert(`${overCount} | ${Math.round(difference * 100)}% | ${ticker}`)
      } else {
        setAlert('')
      }
    }
    checkDifference()
    const intervalId = setInterval(checkDifference, 1000)

    return () => clearInterval(intervalId)
  }, [currentPrice, overCount, tickerData])

  const chartData = useMemo(() => {
    const defaultChartData = {
      labels: ['Bids', 'Asks'],
      datasets: [
        {
          name: 'Bids',
          values: [0, 0],
        },
        {
          name: 'Asks',
          values: [0, 0],
        },
      ],
    }
    if (!tickerData) return defaultChartData

    const bids = tickerData.bids.map(([price, qty]) => ({
      value: qty,
      name: price,
    }))
    const asks = tickerData.asks.map(([price, qty]) => ({
      value: qty,
      name: price,
    }))

    const combinedData = [...bids, ...asks]

    return {
      labels: combinedData.map((item) => item.name),
      datasets: [
        {
          name: 'Bids',
          values: bids.map((bid) => bid.value),
        },
        {
          name: 'Asks',
          values: asks.map((ask) => ask.value),
        },
      ],
    }
  }, [tickerData])

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="container mx-auto max-w-prose p-10 prose">
        <h1>{ticker} Ticker Data</h1>
        <ReactFrappeChart
          type="line"
          height={300}
          data={chartData}
          axisOptions={{
            xAxisMode: 'tick',
            yAxisMode: 'tick',
            xIsSeries: 1,
          }}
          lineOptions={{
            regionFill: 1,
            hideDots: 1,
          }}
        />
        {alert && <p>{alert}</p>}
      </div>
    </Suspense>
  )
}
