import * as erc777Artefact from '@openzeppelin/contracts/build/contracts/IERC777.json';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { USERDATA_PREFIX, encodePayErc777StreamRequest, utils, type IPreparedTransaction } from '@requestnetwork/payment-processor';
import type { ITransactionOverrides } from '@requestnetwork/payment-processor/dist/payment/transaction-overrides';
import { getRequestPaymentValues } from '@requestnetwork/payment-processor/dist/payment/utils';
import { Types } from '@requestnetwork/request-client.js';
import type { ClientTypes } from '@requestnetwork/types';
import { Framework } from '@superfluid-finance/sdk-core';
import {
    ethers,
    providers,
    type BigNumber,
    type ContractTransaction,
    type Overrides,
    type Signer
} from 'ethers';

// Super fluid configs
export const spConfigs = new Map<string, { resolverAddress: string }>([
    [
        "sepolia",
        {
            resolverAddress: "0x6813edE4E78ecb830d380d0F7F684c12aAc95F02"
        },

    ],
    [
        "mainnet",
        {
            resolverAddress: "0xeE4cD028f5fdaAdeA99f8fc38e8bA8A57c90Be53"
        }
    ],
    [
        "polygon",
        {
            resolverAddress: "0x8bDCb5613153f41B2856F71Bd7A7e0432F6dbe58"
        }
    ],

]);

// The default library does not support custom chains or the singleton pattern when creating a Framework instance.
// This custom function addresses those issues.
let rf: Framework;

export async function getSuperFluidFramework(
    request: ClientTypes.IRequestData,
    provider: providers.Provider,
): Promise<Framework> {
    try {
        const resolverAddress = spConfigs.get(request.currencyInfo.network?.toString() || "")?.resolverAddress;
        const chainId = (await provider.getNetwork()).chainId;
        if (!rf || (rf.settings?.chainId !== chainId)) {
            rf = await Framework.create({
                chainId,
                provider: provider,
                resolverAddress: resolverAddress
            });
        }
    } catch (e) {
        console.log("Could not create the SuperFluid framework instance", e);
    }
    return rf;

}


export async function prepareErc777StreamPaymentTransaction(
    request: ClientTypes.IRequestData,
    provider: providers.Provider,
): Promise<IPreparedTransaction> {
    utils.validateRequest(request, Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM);
    const sf: Framework = await getSuperFluidFramework(request, provider);

    const encodedTx = await encodePayErc777StreamRequest(request, sf);

    return {
        data: encodedTx,
        to: sf.host.contract.address,
        value: 0,
    };
}


export async function payErc777StreamRequest(
    request: ClientTypes.IRequestData,
    signer: Signer,
    overrides?: Overrides,
): Promise<ContractTransaction> {
    const { data, to, value } = await prepareErc777StreamPaymentTransaction(
        request,
        //@ts-ignore
        signer.provider ?? utils.getProvider(),
    );
    return signer.sendTransaction({ data, to, value, ...overrides });
}

export async function checkExistingStream(
    request: ClientTypes.IRequestData,
    sender: string,
    signer: Signer,
): Promise<{ data: any[], existed: boolean }> {
    try {
        const id = getPaymentNetworkExtension(request)?.id;
        if (id !== Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM) {
            throw new Error('Not a supported ERC777 payment network request');
        }
        utils.validateRequest(request, Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM);

        const { paymentAddress } = getRequestPaymentValues(request);
        let sf = await getSuperFluidFramework(
            request,
            // @ts-ignore
            signer.provider ?? utils.getProvider()
        );
        const streams = await sf.query.listStreams({
            sender,
            receiver: paymentAddress,
            token: request.currencyInfo.value,
        });
        console.log("List streams:", streams.data);
        return { data: streams.data, existed: streams.data.length > 0 && streams.data[0].currentFlowRate !== '0' };
    } catch (e: any) {
        console.log("Could not check existing streams", e.message);
    }

    return { data: [], existed: false };

}

/**
 * Encode the transaction data for a one off payment of ERC777 Tokens
 * @param request to encode the payment for
 * @param amount the amount to be sent
 * @returns the encoded transaction data
 */
export const encodeErc777OneOffPayment = (
    request: ClientTypes.IRequestData,
    amount: BigNumber,
): string => {
    const id = getPaymentNetworkExtension(request)?.id;
    if (id !== Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM) {
        throw new Error('Not a supported ERC777 payment network request');
    }
    utils.validateRequest(request, Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM);
    const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
    const erc777 = ethers.ContractFactory.getInterface(erc777Artefact.abi);
    return erc777.encodeFunctionData('send', [
        paymentAddress,
        amount,
        `${USERDATA_PREFIX}${paymentReference}`,
    ]);
};

/**
* Prepare the transaction for a one payment for the user to sign
* @param request to prepare the transaction for
* @param amount the amount to be sent
* @returns the prepared transaction
*/
export const prepareErc777OneOffPayment = (
    request: ClientTypes.IRequestData,
    amount: BigNumber,
): IPreparedTransaction => {
    return {
        data: encodeErc777OneOffPayment(request, amount),
        to: request.currencyInfo.value,
        value: 0,
    };
};

/**
 * Make an ERC777 payment
 * @param request associated to the payment
 * @param amount the amount to be sent
 * @param signer the transaction signer
 * @returns the transaction result
 */
export const makeErc777OneOffPayment = async (
    request: ClientTypes.IRequestData,
    amount: BigNumber,
    signer: Signer,
    overrides?: ITransactionOverrides,
): Promise<ContractTransaction> => {
    const preparedTx = prepareErc777OneOffPayment(request, amount);
    return signer.sendTransaction({ ...preparedTx, ...overrides });
};



/**
 * Get from SuperFluid framework the operation to stop paying a request.
 * @param sender the address who created the stream
 * @param sf the SuperFluid framework to use
 * @param request the request to pay
 * @param overrides optionally, override default transaction values, like gas.
 */
async function getStopStreamOp(
    sender: string,
    sf: Framework,
    request: ClientTypes.IRequestData,
    overrides?: Overrides,
) {
    const superToken = await sf.loadSuperToken(request.currencyInfo.value);
    const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
    return sf.cfaV1.deleteFlow({
        superToken: superToken.address,
        sender,
        receiver: paymentAddress,
        userData: `${USERDATA_PREFIX}${paymentReference}`,
        overrides: overrides,
    });
}

/**
 * Encodes the call to close a SuperFluid stream.
 * @param request the request to pay
 * @param sf the SuperFluid framework to use
 */
export async function encodeCloseStreamRequest(
    sender: string,
    request: ClientTypes.IRequestData,
    sf: Framework,
): Promise<string> {
    const closeStreamOp = await getStopStreamOp(sender, sf, request);

    // FIXME: according to specs PR https://github.com/RequestNetwork/requestNetwork/pull/688
    // in file packages/advanced-logic/specs/payment-network-erc777-stream-0.1.0.md
    // Below are the SF actions to add in the BatchCall :
    // - use expectedEndDate to compute offset between stop of invoicing and stop of streaming
    // - stop fee streaming
    const batchCall = sf.batchCall([closeStreamOp]);
    const operationStructArray = await Promise.all(batchCall.getOperationStructArrayPromises);
    return batchCall.host.contract.interface.encodeFunctionData('batchCall', [operationStructArray]);
}

/**
 * Prepare the transaction to close a SuperFluid stream.
 * @param request the request to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 */
export async function prepareCloseStreamTransaction(
    sender: string,
    request: ClientTypes.IRequestData,
    provider: providers.Provider,
): Promise<IPreparedTransaction> {
    const id = getPaymentNetworkExtension(request)?.id;
    if (id !== Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM) {
        throw new Error('Not a supported ERC777 payment network request');
    }
    utils.validateRequest(request, Types.Extension.PAYMENT_NETWORK_ID.ERC777_STREAM);

    const sf = await getSuperFluidFramework(request, provider);
    const encodedTx = await encodeCloseStreamRequest(sender, request, sf);

    return {
        data: encodedTx,
        to: sf.host.contract.address,
        value: 0,
    };
}

/**
 * Processes a transaction to close an ERC777 stream paying a Request.
 * @param request the request to pay
 * @param signer the Web3 signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function closeErc777StreamRequest(
    request: ClientTypes.IRequestData,
    signer: Signer,
    overrides?: Overrides,
): Promise<ContractTransaction> {
    const { data, to, value } = await prepareCloseStreamTransaction(
        await signer.getAddress(),
        request,
        //@ts-ignore
        signer.provider ?? utils.getProvider(),
    );
    return signer.sendTransaction({ data, to, value, ...overrides });
}