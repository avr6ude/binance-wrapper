import { Suspense, useEffect, useState } from 'react'
import ReactFrappeChart from 'react-frappe-charts'
import getTickerData from 'helpers/binanceApi'

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

export default function () {
  const [tickerData, setTickerData] = useState<TickerData | null>(null)
  const ticker = 'BTCUSDT'

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await getTickerData(ticker)
        setTickerData(data)
      } catch (e) {
        console.error(`Error fetching price for ${ticker}: ${e}`)
      }
    }

    void fetchPrice()

    const intervalId = setInterval(fetchPrice, 1000)
    return () => clearInterval(intervalId)
  }, [])

  const chartData = {
    labels: ['Open', 'High', 'Low'],
    datasets: [
      {
        name: 'value',
        values: tickerData
          ? [
              parseFloat(tickerData.openPrice),
              parseFloat(tickerData.highPrice),
              parseFloat(tickerData.lowPrice),
            ]
          : [],
      },
    ],
  }
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="container mx-auto max-w-prose p-10 prose">
        <h1>{ticker} Ticker Data</h1>
        {/* <ReactFrappeChart
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
        /> */}
        {tickerData && (
          <div>
            <p>Bid Price: {tickerData.bidPrice}</p>
            <p>Bid Quantity: {tickerData.bidQty}</p>
            <p>Ask Price: {tickerData.askPrice}</p>
            <p>Ask Quantity: {tickerData.askQty}</p>
            <p>Open Price: {tickerData.openPrice}</p>
            <p>High Price: {tickerData.highPrice}</p>
            <p>Low Price: {tickerData.lowPrice}</p>
            <p>Volume: {tickerData.volume}</p>
            <p>First ID: {tickerData.firstId}</p>
            <p>Last ID: {tickerData.lastId}</p>
          </div>
        )}
      </div>
    </Suspense>
  )
}
