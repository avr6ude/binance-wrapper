import axios from 'axios'

const BASE_URL = 'https://api.binance.com'

interface BinanceSymbol {
  symbol: string
  quoteAsset: string
  baseAsset: string
}

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

export async function getUSDTPairs() {
  try {
    const res = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`)
    const symbols: BinanceSymbol[] = res.data.symbols
    const USDTpairs = symbols.filter((s) => s.quoteAsset === 'USDT')
    return USDTpairs
  } catch (e) {
    console.error('Error getting ticket data', e)
    return []
  }
}
