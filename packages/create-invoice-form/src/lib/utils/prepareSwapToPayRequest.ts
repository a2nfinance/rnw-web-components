import { Types, Utils } from "@requestnetwork/request-client.js";
import { parseUnits, zeroAddress } from "viem";
import { generateContentDataRequest } from "./generateContentData";
import type { IRequestParams } from "./types";

export const prepareSwapToPayRequestParams = ({
  signer,
  currency,
  formData,
  currencies,
  invoiceTotals,
  swapCurrency
}: IRequestParams): Types.ICreateRequestParameters => {

  let generatedContentData = generateContentDataRequest(currency, formData, currencies);
  return {

    requestInfo: {
      currency: {
        type: currencies.get(currency)!.type,
        value: currencies.get(currency)!.value,
        network: currencies.get(currency)!.network,
      },
      expectedAmount: parseUnits(
        invoiceTotals.totalAmount.toFixed(2),
        currencies.get(currency)!.decimals
      ).toString(),
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
      id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      parameters: {
        paymentNetworkName: currencies.get(currency)!.network,
        paymentAddress: formData.payeeAddress,
        feeAddress: zeroAddress,
        feeAmount: "0",
      }
    },
    contentData: {
      ...generatedContentData, miscellaneous: {
        swapSettings: {
          deadline: 2599732187000, // This test will fail in 2052
          maxInputAmount: parseUnits(
            formData.maxInputAmount?.toString() || "1",
            currencies.get(swapCurrency)!.decimals
          ).toString(),
          path: [currencies.get(swapCurrency)!.value, currencies.get(currency)!.value],
        },
        labels: formData.miscellaneous.labels,
      }
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: signer,
    },
  }
};