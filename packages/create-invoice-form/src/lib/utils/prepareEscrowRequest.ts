import { Types, Utils } from "@requestnetwork/request-client.js";
import { parseUnits, zeroAddress } from "viem";
import { generateContentDataRequest } from "./generateContentData";
import type { IRequestParams } from "./types";

export const prepareEscrowRequestParams = ({
  signer,
  currency,
  formData,
  currencies,
  invoiceTotals,
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
      },
    },
    contentData: {
      ...generatedContentData, 
      miscellaneous: {
        escrowSettings: "true",
        labels: formData.miscellaneous.labels,
      }
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: signer,
    },
  }
};