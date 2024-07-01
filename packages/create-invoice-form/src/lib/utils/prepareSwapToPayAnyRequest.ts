import { utils } from "@requestnetwork/payment-processor";
import { Types, Utils } from "@requestnetwork/request-client.js";
import type { IRequestParams } from "./types";
import { parseUnits } from "viem";
import { generateContentDataRequest } from "./generateContentData";

// Test Swap to pay
export const prepareSwapToPayAnyRequestParams = ({
  signer,
  currency,
  formData,
  currencies,
  invoiceTotals,
  swapCurrency,
  fiat
}: IRequestParams): Types.ICreateRequestParameters => {
  let generatedContentData = generateContentDataRequest(currency, formData, currencies);
  return {
    requestInfo: {
      currency: {
        type: Types.RequestLogic.CURRENCY.ISO4217,
        value: fiat || "USD",
      },
      expectedAmount: invoiceTotals.totalAmount,
      payee: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: formData.creatorId,
      },
      payer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: formData.payerAddress,
      },
      timestamp: Utils.getCurrentTimestampInSecond(),
    },
    paymentNetwork: {
      id: Types.Extension.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
      parameters: {
        network: currencies.get(currency)!.network,
        paymentAddress: formData.payeeAddress,
        acceptedTokens: [currencies.get(currency)!.value],
        feeAddress: formData.payerAddress,
        feeAmount: "0",
      }
    },
    contentData: {
      ...generatedContentData, miscellaneous: {
        conversionSettings: {
          currency: {
            type: Types.RequestLogic.CURRENCY.ERC20,
            value: currencies.get(currency)!.value,
            network: currencies.get(currency)!.network,
          }
        },
        swapSettings: {
          deadline: 2599732187000, // This test will fail in 2052
          maxInputAmount: parseUnits(
            formData.maxInputAmount?.toString() || "1",
            currencies.get(swapCurrency)!.decimals
          ).toString(),
          path: [currencies.get(swapCurrency)!.value, currencies.get(currency)!.value],
        },
        labels: formData.miscellaneous.labels
      }
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: signer,
    },
  }
};