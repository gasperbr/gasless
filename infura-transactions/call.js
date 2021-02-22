const { ethers, providers } = require("ethers");

// Loading the contract ABI
// (the results of a previous compilation step)
const fs = require("fs");
const { abi } = JSON.parse(fs.readFileSync("Agent.json"));

const bump = [];

const wait = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function getChainID() {
  switch (process.env.ETHEREUM_NETWORK) {
    case "mainnet":
      return 1;
    case "kovan":
      return 42;
    case "rinkeby":
      return 4;
    case "goerli":
      return 5;
    case "ropsten":
      return 3;
    default:
      throw new Error("You need to set ETHEREUM_NETWORK in your .env file.");
  }
}

function printBump(txHash, price) {
  if (!bump[txHash]) {
    bump[txHash] = true;
    if (process.env.ETHEREUM_NETWORK != "mainnet") {
      console.log(
        `https://${
          process.env.ETHEREUM_NETWORK
        }.etherscan.io/tx/${txHash} @ ${ethers.utils.formatUnits(
          price,
          "gwei"
        )} gwei`
      );
    } else {
      console.log(
        `https://etherscan.io/tx/${txHash} @ ${ethers.utils.formatUnits(
          price,
          "gwei"
        )} gwei`
      );
    }
  }
}

async function main() {
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
    // Address of the contract we want to call
    to: process.env.AGENT_CONTRACT,
    // Encoded data payload representing the contract method call
    data: iface.encodeFunctionData("executeTransaction", ['0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', '0x0Cc7090D567f902F50cB5621a7d6A59874364bA1', '0x0Cc7090D567f902F50cB5621a7d6A59874364bA1', "0", "1289536931817640864", "3", "1614035041", "27", "0x218d1961569c719ef1ce15b4bdb7d14e016c7ef83fe4914281ee5c079e93891d", "0x4de6bb75ed196d10df2dc8e82611ef1d1e1a0a5bda66b6804fb6f2f19008fbe9", "false"]),
    // An upper limit on the gas we're willing to spend
    gas: "250000",
  };

  // Sign a relay request using the signer's private key
  // Final signature of the form keccak256("\x19Ethereum Signed Message:\n" + len((to + data + gas + chainId)) + (to + data + gas + chainId)))
  // Where (to + data + gas + chainId) represents the RLP encoded concatenation of these fields.
  // ITX will check the from address of this signature and deduct balance according to the gas used by the transaction
  const relayTransactionHashToSign = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes", "uint", "uint"],
      [tx.to, tx.data, tx.gas, getChainID()]
    )
  );
  const signature = await signer.signMessage(
    ethers.utils.arrayify(relayTransactionHashToSign)
  );

  // Relay the transaction through ITX
  const sentAtBlock = await itx.getBlockNumber(); // Stats
  const relayTransactionHash = await itx.send("relay_sendTransaction", [
    tx,
    signature,
  ]);
  console.log(`ITX relay transaction hash: ${relayTransactionHash}`);

  // Waiting for the corresponding Ethereum transaction to be mined
  // We poll the relay_getTransactionStatus method for status updates
  // ITX bumps the gas price of your transaction until it's mined,
  // causing a new transaction hash to be created each time it happens.
  // relay_getTransactionStatus returns a list of these transaction hashes
  // which can then be used to poll Infura for their transaction receipts
  console.log("Waiting to be mined...");
  while (true) {
    // fetch the latest ethereum transaction hashes
    const statusResponse = await itx.send("relay_getTransactionStatus", [
      relayTransactionHash,
    ]);

    // check each of these hashes to see if their receipt exists and
    // has confirmations
    for (let i = 0; i < statusResponse.length; i++) {
      const hashes = statusResponse[i];
      const receipt = await itx.getTransactionReceipt(hashes["ethTxHash"]);
      printBump(hashes["ethTxHash"], hashes["gasPrice"]); // Print bump

      if (receipt && receipt.confirmations && receipt.confirmations > 1) {
        // The transaction is now on chain!
        console.log(`Ethereum transaction hash: ${receipt.transactionHash}`);
        console.log(`Sent at block ${sentAtBlock}`);
        console.log(`Mined in block ${receipt.blockNumber}`);
        console.log(`Total blocks ${receipt.blockNumber - sentAtBlock}`);
        return;
      }
    }
    await wait(1000);
  }
}

require("dotenv").config();
main();
