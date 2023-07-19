import axios from 'axios'

const BASE_URL = 'https://api.binance.com'

export default async function getBinanceData(symbol: string, endpoint: string) {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/v3/${endpoint}?symbol=${symbol}`
    )
    return res.data
  } catch (e) {
    console.error('Error getting ticket data', e)
    throw e
  }
}
