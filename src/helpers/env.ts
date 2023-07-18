import { cleanEnv, str } from 'envalid'

export default cleanEnv(process.env, {
  API_KEY: str(),
  API_SECRET: str(),
  BASE_URL: str({ default: 'https://api.binance.com' }),
  MONGO_URL: str(),
})
