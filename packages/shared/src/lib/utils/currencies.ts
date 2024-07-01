import { Types } from "@requestnetwork/request-client.js";

interface ICurrency extends Types.RequestLogic.ICurrency {
  name: string;
  symbol: string;
  chainId: number;
  decimals: number;
}

const currenciesTestnet = new Map<string, ICurrency>([
  [
    "11155111_0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C",
    {
      name: "FaucetToken",
      symbol: "FAU",
      value: "0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C",
      chainId: 11155111,
      network: "sepolia",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
  [
    "11155111_0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    {
      name: "USD Coin",
      symbol: "USDC",
      value: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      chainId: 11155111,
      network: "sepolia",
      decimals: 6,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
]);

const mainnetCurrencies = new Map<string, ICurrency>([
  [
    "1_0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    {
      name: "USD Coin",
      symbol: "USDC",
      value: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      chainId: 1,
      network: "mainnet",
      decimals: 6,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
  [
    "1_0xdAC17F958D2ee523a2206206994597C13D831ec7",
    {
      name: "Tether USD",
      symbol: "USDT",
      value: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      chainId: 1,
      network: "mainnet",
      decimals: 6,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
  [
    "1_0x6B175474E89094C44Da98b954EedeAC495271d0F",
    {
      name: "Dai Stablecoin",
      symbol: "DAI",
      value: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      chainId: 1,
      network: "mainnet",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
]);

const polygonCurrencies = new Map<string, ICurrency>([
  [
    "137_0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    {
      name: "USD Coin",
      symbol: "USDC",
      value: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      chainId: 137,
      network: "matic",
      decimals: 6,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
  [
    "137_0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    {
      name: "Tether USD",
      symbol: "USDT",
      value: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      chainId: 137,
      network: "matic",
      decimals: 6,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
  [
    "137_0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    {
      name: "Dai Stablecoin",
      symbol: "DAI",
      value: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      chainId: 137,
      network: "matic",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
  [
    "137_0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    {
      name: "USD Coin (E)",
      symbol: "USDCE",
      value: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      chainId: 137,
      network: "matic",
      decimals: 6,
      type: Types.RequestLogic.CURRENCY.ERC20,
    },
  ],
]);

export const getCurrenciesByNetwork = (
  network: string
): Map<string, ICurrency> => {
  let currencies = new Map();

  switch (network.toLowerCase()) {
    case "sepolia":
    case "11155111":
      currencies = currenciesTestnet;
      break;
    case "mainnet":
    case "1":
      currencies = mainnetCurrencies;
      break;
    case "matic":
    case "137":
      currencies = polygonCurrencies;
      break;
    default:
      currencies = mainnetCurrencies;
  }
  return currencies;
};




export const erc777Sepolia = new Map<string, ICurrency>([
  [
    "11155111_0xb598E6C621618a9f63788816ffb50Ee2862D443B",
    {
      name: "Super fUSDC Fake Token",
      symbol: "fUSDCx",
      value: "0xb598E6C621618a9f63788816ffb50Ee2862D443B",
      chainId: 11155111,
      network: "sepolia",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ],
  [
    "11155111_0x9ce2062b085a2268e8d769ffc040f6692315fd2c",
    {
      name: "Super fDAI Fake Token",
      symbol: "fDAIx",
      value: "0x9ce2062b085a2268e8d769ffc040f6692315fd2c",
      chainId: 11155111,
      network: "sepolia",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ],
  ["11155111_0x30a6933ca9230361972e413a15dc8114c952414e",
    {
      name: "Super ETH",
      symbol: "ETHx",
      value: "0x30a6933ca9230361972e413a15dc8114c952414e",
      chainId: 11155111,
      network: "sepolia",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ],
]);

export const erc777Mainnet = new Map<string, ICurrency>([
  [

    "1_0xc22bea0be9872d8b7b3933cec70ece4d53a900da",
    {
      name: "ETHx",
      symbol: "ETHx",
      value: "0xc22bea0be9872d8b7b3933cec70ece4d53a900da",
      chainId: 1,
      network: "mainnet",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },

  ],
  [
    "1_0x4f228bf911ed67730e4b51b1f82ac291b49053ee",
    {
      name: "Super Dai Stablecoin",
      symbol: "DAIx",
      value: "0x4f228bf911ed67730e4b51b1f82ac291b49053ee",
      chainId: 1,
      network: "mainnet",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },

  ],
  [
    "1_0x1ba8603da702602a8657980e825a6daa03dee93a",
    {
      name: "Super USD Coin",
      symbol: "USDCx",
      value: "0x1ba8603da702602a8657980e825a6daa03dee93a",
      chainId: 1,
      network: "mainnet",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ]
]);


export const erc777Polygon = new Map<string, ICurrency>([
  [

    "137_0xfd0577c4707367ff9b637f219388919d3be37592",
    {
      name: "Super Gains Network",
      symbol: "GNSx",
      value: "0xfd0577c4707367ff9b637f219388919d3be37592",
      chainId: 137,
      network: "matic",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ],
  [
    "137_0xfbb291570de4b87353b1e0f586df97a1ed856470",
    {
      name: "Super JPY Coin (PoS)",
      symbol: "GNSx",
      value: "0xfbb291570de4b87353b1e0f586df97a1ed856470",
      chainId: 137,
      network: "matic",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ],
  [
    "137_0xfac83774854237b6e31c4b051b91015e403956d3",
    {
      name: "Astro Gold",
      symbol: "AGOLD",
      value: "	0xfac83774854237b6e31c4b051b91015e403956d3",
      chainId: 137,
      network: "matic",
      decimals: 18,
      type: Types.RequestLogic.CURRENCY.ERC777,
    },
  ]
]);

export const getErc777Currencies = (network: string): Map<string, ICurrency> => {

  let streamTokens = new Map();

  switch (network.toLowerCase()) {
    case "sepolia":
    case "11155111":
      streamTokens = erc777Sepolia;
      break;
    case "mainnet":
    case "1":
      streamTokens = erc777Mainnet;
      break;
    case "matic":
    case "137":
      streamTokens = erc777Polygon;
      break;
    default:
      streamTokens = erc777Mainnet;
  }
  return streamTokens;

}