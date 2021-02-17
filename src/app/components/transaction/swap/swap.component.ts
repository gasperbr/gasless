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
  tradeAmount: string;
  tradeAmountValid = false;
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
    this.tradeAmount = undefined;
    this.balance = await this.ethereumService.getBalanceOfToken(_token.address);
  }

  async amountChange(_tradeAmount: string) {
    _tradeAmount.replace(/[0-9]/g, '')

    this.expectedOutput = undefined;
  }

}
