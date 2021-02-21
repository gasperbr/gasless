import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contract, ethers } from "ethers";
import { BehaviorSubject } from 'rxjs';
import { erc20abi } from './abis';
import { TokenInfo, TokenListService } from './token-list.service';
import axios from 'axios';
import { environment } from 'src/environments/environment';


declare global {
  interface Window { ethereum: any; }
}


@Injectable({
  providedIn: 'root'
})
export class EthereumService {

  public $provider = new BehaviorSubject<ethers.providers.Web3Provider>(undefined);
  public $signer = new BehaviorSubject<ethers.providers.JsonRpcSigner>(undefined);
  public $address = new BehaviorSubject<string>("");

  get provider() { return this.$provider.value };
  get signer() { return this.$signer.value };
  get address() { return this.$address.value };

  network: ethers.providers.Network;

  constructor(
    private snackBar: MatSnackBar,
    private tokenService: TokenListService
  ) {

    this.initMetamask();
    this.changes();

  }

  public async initMetamask() {

    if (!!window.ethereum) {

      await window.ethereum.enable();

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const signer = provider.getSigner();

      this.$provider.next(provider);
      this.$signer.next(signer);

      signer.getAddress().then(address => this.$address.next(address));

      provider.getNetwork().then(network => this.checkNetwork(network));

    } else {

      this.snackBar.open("Please use a Web3 enabled browser.", "OK", { duration: 3000 });

    }
  }

  changes() {
    if (!!window.ethereum) {
      window.ethereum.on('accountsChanged', () => this.initMetamask());
      window.ethereum.on('chainChanged', () => this.initMetamask);
      window.ethereum.on('networkChanged', () => this.initMetamask());
    }
  }

  checkNetwork(network: ethers.providers.Network) {
    if (network.chainId === 1) {
      network.name = 'Mainnet';
    }
    if (network.chainId !== 4) {
      this.snackBar.open("Please switch to the Rinkeby network.", "OK", { duration: 10000 });
    }
    this.network = network;
  }

  public async getBalanceOfToken(tokenAddress: string, decimals: number) {
    const address = this.$address.value;

    if (!address || !tokenAddress) {
      console.error('User or token address missing')
      return undefined;
    }

    const contract = new Contract(tokenAddress, erc20abi, this.provider);
    const balance = await contract.balanceOf(address);
    const strBalance = balance.toString();
    const len = strBalance.length;

    if (len > decimals) {
      return strBalance.slice(0, len - decimals) + "." + strBalance.slice(len - decimals, strBalance);
    } else {
      return "0." + ("0".repeat(decimals - len)) + strBalance;
    }

  }

  async calculateTradeOutput(_token: TokenInfo, amount: string): Promise<{ gasCost: string, ethOutput: string, estimate: string } | string> {
    const baseUrl = `${window.location.protocol}//${window.location.host}/api/estimate-output?`;
    let data;
    await axios.get(baseUrl + `tokenAddress=${_token.address}&tokenAmount=${amount}&decimals=${_token.decimals}`).then(res => {
      data = res.data
    }).catch(e => {
      this.snackBar.open("An error occured.", ':(')
    });
    return data;
  }


  async sendTx(_token: TokenInfo, amount) {

    const token = new ethers.Contract(
      _token.address,
      erc20abi,
      this.provider
    );

    const nonce = await token.nonces(this.address).then(nonce => nonce.toHexString());

    const deadline = Math.round((new Date().getTime() / 1000) + 86400);
    console.log(deadline);

    const data = this.tokenService.getTypedData(_token, amount, this.address, environment.agentContract, nonce, deadline);

    console.log(data)

    // Directly call the JSON RPC interface, since ethers does not support signTypedDataV4 yet
    // See https://github.com/ethers-io/ethers.js/issues/830
    const signature = await this.provider.send('eth_signTypedData_v4', [this.address, data]).catch(console.log);

    const splitSignature = ethers.utils.splitSignature(signature);

    console.log(splitSignature);

  }

}

const forwarderAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "_from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "remaining",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "nonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "v",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "r",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "permit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
