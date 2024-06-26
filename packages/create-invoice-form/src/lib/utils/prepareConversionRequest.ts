import { utils } from "@requestnetwork/payment-processor";
import { Types, Utils } from "@requestnetwork/request-client.js";
import type { IRequestParams } from "./types";
import { zeroAddress } from "viem";
// 1000 => 10.00 EURO
// Fiat has decimals is 2
// For test
export const prepareConversionRequestParams = ({
    signer,
    currency,
    formData,
    currencies,
    invoiceTotals,
}: IRequestParams): Types.ICreateRequestParameters => {
    let paymentNetwork: any = {
        id: Types.Extension.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
        parameters: {
            network: currencies.get(currency)!.network,
            paymentAddress: formData.payeeAddress,
            acceptedTokens: [currencies.get(currency)!.value],
            feeAddress: zeroAddress,
            feeAmount: "0",
        },
    };
    if (currencies.get(currency)!.symbol === "ETH") {
        paymentNetwork = {
            id: Types.Extension.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
            parameters: {
                network: currencies.get(currency)!.network,
                paymentAddress: formData.payeeAddress,
                acceptedTokens: [currencies.get(currency)!.value],
                feeAddress: zeroAddress,
                feeAmount: "0",
            },
        };
    }
    
    return {
        requestInfo: {
            // Need to get from FormData
            currency: {
                type: Types.RequestLogic.CURRENCY.ISO4217,
                value: "USD"
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
            timestamp: Utils.getCurrentTimestampInSecond()
        },
        paymentNetwork: paymentNetwork,
        contentData: {
            meta: {
                format: "rnf_invoice",
                version: "0.0.3",
            },
            miscellaneous: {
                conversionSettings: {
                    currency: {
                        type: Types.RequestLogic.CURRENCY.ERC20,
                        value: currencies.get(currency)!.value,
                        network: currencies.get(currency)!.network,
                    },
                    maxToSpend: `${utils.MAX_ALLOWANCE}`,
                },
                labels: formData.miscellaneous.labels,
            },
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
            }
        },
        signer: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: signer,
        },
    }
}