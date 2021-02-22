import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EthereumService } from 'src/app/services/ethereum.service';
import { TokenInfo, TokenListService } from 'src/app/services/token-list.service';
import { utils } from 'ethers';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})
export class SwapComponent implements OnInit {

  token: TokenInfo;
  tokens: TokenInfo[];
  tradeAmount = "";
  tradeAmountActual = "";
  tradeAmountValid = true;
  tooMuch = false;
  balance: string;
  expectedOutput: string;
  cost: string;
  sending = false;
  mining = false;
  allTx: string[];
  minedTx: string = "";

  constructor(
    private tokenListService: TokenListService,
    private ethereumService: EthereumService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.tokens = this.tokenListService.getAllTokens();
  }

  async tokenChange(_token: TokenInfo) {
    this.balance = undefined;
    this.tradeAmount = "";
    this.tradeAmountActual = "";
    this.balance = await this.ethereumService.getBalanceOfToken(_token.address, _token.decimals);
  }

  async amountChange(_tradeAmount: string) {

    this.tradeAmountActual = "";
    this.expectedOutput = undefined;
    this.tradeAmountValid = true;
    this.tooMuch = false;

    if (!this.token) return;

    const noNum = _tradeAmount.replace(/[0-9]/g, '');

    if (noNum !== "" && noNum !== "." || _tradeAmount.length === 0) {
      this.tradeAmountValid = false;
      return;
    }

    const tradeAmount = this.formatNumber(_tradeAmount, this.token.decimals);

    const intAmount = BigInt(tradeAmount.replace('.', ''));
    const intBalance = BigInt(this.balance.replace('.', ''));

    if (intBalance < intAmount) {
      this.tradeAmountValid = false;
      this.tooMuch = true;
    }

    if (!this.tradeAmountValid) {
      return;
    }

    this.tradeAmountActual = intAmount.toString(10)
    if (intAmount > 0) {
      this.getEth(this.tradeAmountActual);
    }
  }

  async getEth(amount: string) {
    const data = await this.ethereumService.calculateTradeOutput(this.token, amount);
    if (!data) return;
    if (typeof data === 'string') {
      this.snackBar.open(data, 'OK');
    } else {
      const { gasCost, ethOutput, estimate } = data;
      this.expectedOutput = estimate[0] === '-' ? '0' : this.formatEth(estimate);
      this.cost = this.formatEth(gasCost)
    }
  }

  formatNumber(amount: string, decimals: number) { // e.g. 12341234 -> 0.0000012341234
    if (amount[0] === ".") {
      amount = "0" + amount;
    }
    const dotIndex = amount.indexOf('.')

    if (dotIndex === -1) {
      amount = amount + ("0".repeat(decimals));
    } else if (amount.length - (dotIndex + 1) > decimals) {
      amount = amount.slice(0, dotIndex + decimals)
    } else {
      amount = amount + ("0".repeat(decimals - (amount.length - (dotIndex + 1))));
    }
    return amount;
  }

  formatEth(number: string) { // 12341234 -> 0.000000000012341234
    let num = utils.formatEther(number);
    let i = num.indexOf('.')
    if (i === -1) return num;
    return num.slice(0, i + 7)
  }

  async sign() {
    if (this.tradeAmountValid && this.token && this.tradeAmount && !this.sending && !this.mining) {
      this.minedTx = "";
      const _token = this.token;

      const data = await this.ethereumService.signTx(_token, this.tradeAmountActual);
      this.sending = true;

      const itxTx = await this.ethereumService.sendTx(_token, data);
      this.sending = false;

      if (!itxTx) return;
      this.mining = true;

      while (true) {
        const response = await this.ethereumService.getTxStatus(itxTx);
        console.log(response);
        if (response.mined) {
          this.minedTx = `https://rinkeby.etherscan.io/tx/${response.minedTx}`
          this.allTx = [];
          this.mining = false;
          return;
        } else {
          this.allTx = response.allTx.map(data => `https://rinkeby.etherscan.io/tx/${data["ethTxHash"]}`);
        }
        await (new Promise((resolve) => setTimeout(resolve, 1000)));
      }
    }
  }

}
