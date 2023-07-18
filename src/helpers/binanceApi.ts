import axios from 'axios'

const BASE_URL = 'https://api.binance.com'

export default async function getTickerData(symbol: string) {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/v3/ticker/24hr?symbol=${symbol}`
    )
    return res.data
  } catch (e) {
    console.error('Error getting ticket data', e)
    throw e
  }
}
