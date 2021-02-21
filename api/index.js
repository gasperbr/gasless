require('dotenv').config()
const axios = require('axios')
const app = require('express')()
const { ChainId, Token, Fetcher, Trade, Route, TokenAmount, TradeType, WETH } = require('@uniswap/sdk')
const BigInteger = require('jsbn').BigInteger

// api-rinkeby.etherscan.io returns the same gas estimation as api.etherscan.io
const gasPriceUrl = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`

async function getGasPrice() {
  const res = await axios.get(gasPriceUrl)
  const success = res.status === 200 && res.data.message === 'OK'
  return success ? res.data.result.ProposeGasPrice : -1
}

async function getTradeOutput(address, amount, decimals) {

  const TOKEN = new Token(ChainId.RINKEBY, address, decimals)
  const pair = await Fetcher.fetchPairData(TOKEN, WETH[TOKEN.chainId])
  const route = new Route([pair], TOKEN)

  let trade

  try {
    trade = new Trade(route, new TokenAmount(TOKEN, amount), TradeType.EXACT_INPUT)
  } catch (error) {
    return -1
  }

  return new BigInteger(String(trade.outputAmount.raw))
}

async function calcualteGasCost() {
  const _gasPrice = await getGasPrice()
  if (_gasPrice === -1) return -1

  const gasUnits = new BigInteger('150000')
  const gasPrice = new BigInteger('' + _gasPrice)
  const gweiDenomination = new BigInteger('1000000000')
  return gasUnits.multiply(gasPrice).multiply(gweiDenomination)
}

async function getEstimate(address, amount, decimals) {
  const ethOutput = await getTradeOutput(address, amount, decimals)
  const gasCost = await calcualteGasCost()
  if (ethOutput === -1 || gasCost === -1) return "Could not calculate estimate."
  return {
    gasCost: gasCost.toString(10),
    ethOutput: ethOutput.toString(10),
    estimate: ethOutput.subtract(gasCost).toString(10)
  }
}

app.get('/api/estimate-output', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')


  const address = req.query.tokenAddress
  const amount = req.query.tokenAmount
  const decimals = parseInt(req.query.decimals ?? '18')
  const estimate = await getEstimate(address, amount, decimals)
  res.end(JSON.stringify(estimate))
})

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params
  res.end(`Item: ${slug}`)
})

module.exports = app


