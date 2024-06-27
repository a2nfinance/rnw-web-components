import { Types, Utils } from "@requestnetwork/request-client.js";
import { parseUnits } from "viem";
import type { IRequestParams } from "./types";

export const prepareStreamRequestParams = ({
    signer,
    currency,
    formData,
    currencies,
    invoiceTotals,
    streamToken,
    streamTokens
  }: IRequestParams): Types.ICreateRequestParameters => ({
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
      meta: {
        format: "rnf_invoice",
        version: "0.0.3",
      },
      miscellaneous: {
        streamSettings: "true",
        labels: formData.miscellaneous.labels,
      },
      creationDate: new Date(formData.issuedOn).toISOString(),
      invoiceNumber: formData.invoiceNumber,
      note: formData.note.length > 0 ? formData.note : undefined,
      invoiceItems: formData.items.map((item) => ({
        name: item.description,
        quantity: Number(item.quantity),
        unitPrice: parseUnits(
          item.unitPrice.toString(),
          currencies.get(currency)!.decimals
        ).toString(),
        discount: parseUnits(
          item.discount.toString(),
          currencies.get(currency)!.decimals
        ).toString(),
        tax: {
          type: "percentage",
          amount: item.tax.amount.toString(),
        },
        currency: currencies.get(currency)!.value,
      })),
      paymentTerms: {
        dueDate: new Date(formData.dueDate).toISOString(),
      },
      buyerInfo: {
        firstName: formData?.buyerInfo?.firstName || undefined,
        lastName: formData?.buyerInfo?.lastName || undefined,
        address: {
          "country-name":
            formData?.buyerInfo?.address?.["country-name"] || undefined,
          locality: formData?.buyerInfo?.address?.locality || undefined,
          "postal-code":
            formData?.buyerInfo?.address?.["postal-code"] || undefined,
          region: formData?.buyerInfo?.address?.region || undefined,
          "street-address":
            formData?.buyerInfo?.address?.["street-address"] || undefined,
        },
        businessName: formData?.buyerInfo?.businessName || undefined,
        taxRegistration: formData?.buyerInfo?.taxRegistration || undefined,
        email: formData?.buyerInfo?.email || undefined,
      },
      sellerInfo: {
        firstName: formData?.sellerInfo?.firstName || undefined,
        lastName: formData?.sellerInfo?.lastName || undefined,
        address: {
          "country-name":
            formData?.sellerInfo?.address?.["country-name"] || undefined,
          locality: formData?.sellerInfo?.address?.locality || undefined,
          "postal-code":
            formData?.sellerInfo?.address?.["postal-code"] || undefined,
          region: formData?.sellerInfo?.address?.region || undefined,
          "street-address":
            formData?.sellerInfo?.address?.["street-address"] || undefined,
        },
        businessName: formData?.sellerInfo?.businessName || undefined,
        taxRegistration: formData?.sellerInfo?.taxRegistration || undefined,
        email: formData?.sellerInfo?.email || undefined,
      }
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: signer,
    },
  });