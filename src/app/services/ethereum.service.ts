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
  baseUrl: string;
  itx: ethers.providers.InfuraProvider;

  constructor(
    private snackBar: MatSnackBar,
    private tokenService: TokenListService
  ) {

    this.initMetamask();
    this.changes();
    this.baseUrl = `${window.location.protocol}//${window.location.host}/api`;
    this.itx = new ethers.providers.InfuraProvider(4, environment.infuraKey);

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
    let data;
    await axios.get(this.baseUrl + `/estimate-output?tokenAddress=${_token.address}&tokenAmount=${amount}&decimals=${_token.decimals}`).then(res => {
      data = res.data
    }).catch(e => {
      this.snackBar.open("An error occured.", ':(')
    });
    return data;
  }


  async sendTx(_token: TokenInfo, { amount, nonce, deadline, v, r, s }) {

    let itxTx;

    await axios.post(this.baseUrl + '/execute-transaction', {
      token: _token.address,
      decimals: _token.decimals,
      owner: this.address,
      receiver: this.address,
      permitVersion: _token.permitVersion,
      amount,
      nonce,
      deadline,
      v,
      r,
      s,
    }).then(res => itxTx = res.data).catch(() => this.snackBar.open('Could not initiate the transaction.', 'OK'));

    return itxTx;

  }

  async signTx(_token: TokenInfo, amount) {
    const token = new ethers.Contract(
      _token.address,
      erc20abi,
      this.provider
    );
    const nonce = await token.nonces(this.address).then(nonce => nonce.toHexString());
    const deadline = Math.round((new Date().getTime() / 1000) + 86400);
    const data = this.tokenService.getTypedData(_token, amount, this.address, environment.agentContract, nonce, deadline);
    const signature = await this.provider.send('eth_signTypedData_v4', [this.address, data]).catch(console.log);
    const { v, r, s } = ethers.utils.splitSignature(signature);
    return { amount, nonce, deadline, v, r, s };
  }

  async getTxStatus(hash) {
    const statusResponse = await this.itx.send("relay_getTransactionStatus", [hash]);
    const response = {
      mined: false,
      minedTx: '',
      allTx: statusResponse
    }
    for (let i = 0; i < statusResponse.length; i++) {
      const hashes = statusResponse[i];
      const receipt = await this.itx.getTransactionReceipt(hashes["ethTxHash"]);
      if (receipt && receipt.confirmations && receipt.confirmations >= 1) {
        response.mined = true;
        response.minedTx = receipt.transactionHash;
      }
    }
    return response;
  }

}
