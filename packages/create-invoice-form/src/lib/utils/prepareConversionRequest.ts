import { Types, Utils } from "@requestnetwork/request-client.js";
import { parseUnits, zeroAddress } from "viem";
import type { IRequestParams } from "./types";
import { generateContentDataRequest } from "./generateContentData";
// 1000 => 10.00 EURO
// Fiat has decimals is 2
// For test
export const prepareConversionRequestParams = ({
    signer,
    currency,
    formData,
    currencies,
    invoiceTotals,
    fiat
}: IRequestParams): Types.ICreateRequestParameters => {
    let generatedContentData = generateContentDataRequest(currency, formData, currencies);
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
                value: fiat || "USD"
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
            ...generatedContentData,
            miscellaneous: {
                conversionSettings: {
                    currency: {
                        type: Types.RequestLogic.CURRENCY.ERC20,
                        value: currencies.get(currency)!.value,
                        network: currencies.get(currency)!.network,
                    },
                    maxToSpend: parseUnits(
                        formData.maxInputAmount?.toString() || "1",
                        currencies.get(currency)!.decimals
                    ).toString(),
                },
                labels: formData.miscellaneous.labels,
            }
        },
        signer: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: signer,
        },
    }
}