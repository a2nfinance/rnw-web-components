import { Types, Utils } from "@requestnetwork/request-client.js";
import { parseUnits } from "viem";
import { generateContentDataRequest } from "./generateContentData";
import type { IRequestParams } from "./types";

export const prepareStreamRequestParams = ({
  signer,
  currency,
  formData,
  currencies,
  invoiceTotals,
  streamToken,
  streamTokens
}: IRequestParams): Types.ICreateRequestParameters => {
  let generatedContentData = generateContentDataRequest(currency, formData, currencies);
  return {
    requestInfo: {
      currency: {
        type: Types.RequestLogic.CURRENCY.ERC777,
        value: streamTokens.get(streamToken)!.value,
        network: streamTokens.get(streamToken)!.network,
      },
      expectedAmount: parseUnits(
        invoiceTotals.totalAmount.toFixed(2),
        streamTokens.get(streamToken)!.decimals
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
      id: Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM,
      parameters: {
        expectedStartDate: new Date(formData.expectedStartDate || "").getTime().toString(),
        expectedFlowRate: parseUnits(
          (formData.expectedFlowRate || 0.01).toString(),
          streamTokens.get(streamToken)!.decimals
        ).toString(),
        paymentAddress: formData.payeeAddress
      },
    },
    contentData: {
      ...generatedContentData, miscellaneous: {
        streamSettings: "true",
        labels: formData.miscellaneous.labels,
      }
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: signer,
    },
  }
};