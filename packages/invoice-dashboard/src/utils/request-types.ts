import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";
import { Types } from "@requestnetwork/request-client.js";

const requestTypes = {
    simple: "Simple",
    swapToPay: "Swap-to-Pay",
    conversion: "Conversion",
    swapToConversion: "Swap-to-Conversion",
    escrow: "Escrow",
    stream: "Stream"
}
export const getRequestType = (requestData: Types.IRequestDataWithEvents) => {
    let paymentId = getPaymentNetworkExtension(requestData)?.id;
    let requestType = "";
    let miscellaneous = requestData?.contentData?.miscellaneous;
    switch (paymentId) {
        case Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT: {
            if (miscellaneous?.swapSettings) {
                requestType = requestTypes.swapToPay;
            } else if (miscellaneous?.escrowSettings) {
                requestType = requestTypes.escrow;
            } else {
                requestType = requestTypes.simple;
            }
            break;
        }
        case Types.Extension.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY: {
            if (miscellaneous?.conversionSettings && !miscellaneous?.swapSettings) {
                requestType = requestTypes.conversion;
            } else if (miscellaneous?.conversionSettings && miscellaneous?.swapSettings) {
                requestType = requestTypes.swapToConversion;
            } else {
                requestType = requestTypes.simple;
            }
            break;
        }
        case Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM: {

            requestType = requestTypes.stream;

            break;
        }
        default:
            break;
    }

    return requestType;
}