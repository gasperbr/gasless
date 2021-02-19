import { Component, OnInit } from '@angular/core';
import { EthereumService } from 'src/app/services/ethereum.service';
import { TokenInfo, TokenListService } from 'src/app/services/token-list.service';

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

  constructor(
    private tokenListService: TokenListService,
    private ethereumService: EthereumService
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

    this.tradeAmountValid = true;
    this.tooMuch = false;

    const noNum = _tradeAmount.replace(/[0-9]/g, '')
    if (noNum !== "" && noNum !== "." || _tradeAmount.length === 0) {
      this.tradeAmountValid = false;
      return;
    }
    const intAmount = BigInt(this.getPaddedAmount(_tradeAmount, this.token.decimals).replace('.', ''));
    const intBalance = BigInt(this.balance.replace('.', ''));
    console.log(this.getPaddedAmount(_tradeAmount, this.token.decimals))
    console.log(intAmount, intBalance);

    if (intBalance < intAmount) {
      this.tradeAmountValid = false;
      this.tooMuch = true;
    }

    if (!this.tradeAmountValid) {
      return;
    }

    this.tradeAmountActual = intAmount.toString(10)
    this.expectedOutput = undefined;
    this.expectedOutput = await this.ethereumService.calculateTradeOutput(this.token, intAmount.toString(10));
  }

  getPaddedAmount(amount: string, decimals: number) {
    if (amount[0] === ".") {
      amount = "0" + amount;
    }
    const dotIndex = amount.indexOf('.')
    if (dotIndex === -1) {
      amount = amount + ("0".repeat(decimals));
    } else {
      amount = amount + ("0".repeat(decimals - (amount.length - (dotIndex + 1))));
    }
    return amount;
  }

}
