import { Types, Utils } from "@requestnetwork/request-client.js";

import { parseEther, zeroAddress } from "viem";
import type { IRequestParams } from "./types";

// Test Swap to pay
export const prepareSwapToPayAnyRequestParams = ({
    signer,
    currency,
    formData,
    currencies,
    invoiceTotals,
  }: IRequestParams): Types.ICreateRequestParameters => ({
    requestInfo: {
      currency: {
        type: Types.RequestLogic.CURRENCY.ISO4217,
        value: "EUR",
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
      id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      parameters: {
        paymentNetworkName: currencies.get(currency)!.network,
        paymentAddress: formData.payeeAddress,
        // acceptedTokens: [currencies.get(currency)!.value],
        feeAddress: zeroAddress,
        feeAmount: "0",
      }
    },
    contentData: {
      meta: {
        format: "rnf_invoice",
        version: "0.0.3",
      },
      miscellaneous:
        formData.miscellaneous.labels.length > 0
          ? formData.miscellaneous
          : undefined,
      creationDate: new Date(formData.issuedOn).toISOString(),
      invoiceNumber: formData.invoiceNumber,
      note: formData.note.length > 0 ? formData.note : undefined,
      invoiceItems: formData.items.map((item) => ({
        name: item.description,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice.toString(),
        discount: item.discount.toString(),
        tax: {
          type: "percentage",
          amount: item.tax.amount.toString(),
        },
        currency: "EUR",
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
      },
      conversionSetting: {
        currency: {
          type: Types.RequestLogic.CURRENCY.ERC20,
          value: currencies.get(currency)!.value,
          network: currencies.get(currency)!.network,
        }
      },
      swapSettings: {
        deadline: 2599732187000, // This test will fail in 2052
        maxInputAmount: parseEther('100').toString(),
        path: ["0x779877A7B0D9E8603169DdbD7836e478b4624789", currencies.get(currency)!.value],
      },
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: signer,
    },
  });