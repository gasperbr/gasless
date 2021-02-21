import { Injectable } from '@angular/core';
import { ChainId, Token, WETH, Fetcher, Trade, Route, TokenAmount, TradeType } from '@uniswap/sdk'

@Injectable({
  providedIn: 'root'
})
export class TokenListService {

  public rinkebyTokens: TokenInfo[] = [
    {
      icon: "https://tokens.1inch.exchange/0x6b175474e89094c44da98b954eedeac495271d0f.png",
      name: "DAI",
      address: "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
      permitVersion: 1,
      decimals: 18,
      Permit: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }, { name: 'allowed', type: 'bool' }],
      EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'unit256' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
      domain: { name: 'Dai Stablecoin', version: 1, chainId: 4, verifyingContract: "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735" },
    },
    {
      icon: "https://tokens.1inch.exchange/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
      name: "UNI",
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      permitVersion: 0,
      decimals: 18,
      Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }],
      EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
      domain: { name: 'Uniswap', chainId: 4, verifyingContract: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" },
    }
  ];

  constructor() { }

  filterTokens(tokenName: string, tokens: TokenInfo[]): TokenInfo[] {
    const filterValue = tokenName.toLowerCase();
    return tokens.filter(token => token.name.toLowerCase().indexOf(filterValue) === 0);
  }

  getAllTokens(): TokenInfo[] {
    return this.rinkebyTokens;
  }

}

export interface TokenInfo {
  icon: string,
  name: string,
  address: string,
  permitVersion: number,
  abi?: any,
  decimals: number,
  EIP712Domain: { name: string, type: string }[],
  domain: { [key: string]: any },
  Permit: { name: string, type: string }[]
}
