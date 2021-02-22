require('dotenv').config()
const axios = require('axios')
const app = require('express')()
const fs = require("fs");
const { ethers } = require("ethers");
const { abi } = JSON.parse(fs.readFileSync("Agent.json"));
const bodyParser = require('body-parser')
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

app.post('/api/execute-transaction', bodyParser.json(), async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')

  const { token, decimals, owner, receiver, permitVersion, amount, nonce, deadline, v, r, s } = req.body
  const data = await getEstimate(token, amount, decimals)

  if (typeof data !== 'object' || data.estimate[0] === '-') {
    res.end(`Could not send request.`)
  } else {
    const tx = await relayCall(token, owner, receiver, permitVersion, amount, nonce, deadline, v, r, s)
    res.end(tx);
  }
})

module.exports = app

async function relayCall(token, owner, receiver, permitVersion, amount, nonce, deadline, v, r, s) {
  // Configure the connection to an Ethereum node
  const itx = new ethers.providers.InfuraProvider(
    process.env.ETHEREUM_NETWORK,
    process.env.INFURA_PROJECT_ID
  );
  // Create a signing account from a private key
  const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, itx);

  // Create a contract interface
  const iface = new ethers.utils.Interface(abi);

  // Create the transaction relay request
  const tx = {
    to: process.env.AGENT_CONTRACT,
    data: iface.encodeFunctionData("executeTransaction", [token, owner, receiver, permitVersion, amount, nonce, deadline, v, r, s, "false"]),
    gas: "250000",
  };

  const relayTransactionHashToSign = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes", "uint", "uint"],
      [tx.to, tx.data, tx.gas, 4]
    )
  );
  const signature = await signer.signMessage(
    ethers.utils.arrayify(relayTransactionHashToSign)
  );

  // Relay the transaction through ITX
  const relayTransactionHash = await itx.send("relay_sendTransaction", [
    tx,
    signature,
  ]);

  return relayTransactionHash
}

