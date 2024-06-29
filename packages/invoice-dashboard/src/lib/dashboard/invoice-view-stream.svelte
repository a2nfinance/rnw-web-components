<script lang="ts">
    import {
        checkExistingStream,
        checkNetwork,
        closeErc777StreamRequest,
        getDecimals,
        getSymbol,
        payErc777StreamRequest,
        walletClientToSigner,
    } from "$src/utils";
    import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";

    import type {
        RequestNetwork,
        Types,
    } from "@requestnetwork/request-client.js";
    import {
        Accordion,
        Button,
        Check,
        calculateItemTotal,
        formatDate,
        getErc777Currencies,
    } from "@requestnetwork/shared";
    import type { WalletState } from "@web3-onboard/core";
    import { formatUnits } from "viem";

    export let config;
    export let wallet: WalletState | undefined;
    export let requestNetwork: RequestNetwork | null | undefined;
    export let request: Types.IRequestDataWithEvents | undefined;
    let progress: number = 0;
    let releaseAmount: number = 0;
    let latestStream: any = null;
    let network = request?.currencyInfo?.network || "mainnet";
    let currencies = getErc777Currencies(network);
    let currency = currencies.get(
        `${checkNetwork(network)}_${request?.currencyInfo?.value}`,
    );
    let paymentInfo = getPaymentNetworkExtension(request!)?.values;
    let statuses: any = [];
    let isPaid = false;
    let loading = false;
    let requestData: any = null;
    let signer: any = null;
    let streamExisted = false;
    let address = wallet?.accounts?.[0]?.address;
    let firstItems: any;
    let otherItems: any;
    let sellerInfo: { label: string; value: string }[] = [];
    let buyerInfo: { label: string; value: string }[] = [];
    let isPayee =
        request?.payee?.value.toLowerCase() === address?.toLowerCase();
    let unsupportedNetwork = false;
    let correctChain =
        wallet?.chains[0].id === String(getNetworkIdFromNetworkName(network));

    const generateDetailParagraphs = (info: any) => {
        return [
            { label: "First Name", value: info?.firstName },
            { label: "Last Name", value: info?.lastName },
            { label: "Company Name", value: info?.businessName },
            { label: "Tax Registration", value: info?.taxRegistration },
            { label: "Country", value: info?.address?.["country-name"] },
            { label: "City", value: info?.address?.locality },
            { label: "Region", value: info?.address?.region },
            { label: "Postal Code", value: info?.address?.["postal-code"] },
            {
                label: "Street Address",
                value: info?.address?.["street-address"],
            },
            { label: "Email", value: info?.email },
        ].filter((detail) => detail.value);
    };

    let currencyDetails = {
        symbol: "",
        decimals: 0,
    };

    $: {
        firstItems = request?.contentData
            ? request?.contentData?.invoiceItems?.slice(0, 3)
            : [];
        otherItems = request?.contentData
            ? request?.contentData?.invoiceItems?.slice(3)
            : [];
    }

    $: {
        sellerInfo = generateDetailParagraphs(request?.contentData.sellerInfo);
        buyerInfo = generateDetailParagraphs(request?.contentData.buyerInfo);
    }

    $: request, checkInvoice();

    $: {
        wallet = wallet;
        network = request?.currencyInfo?.network || "mainnet";
        currencies = getErc777Currencies(network);
        currency = currencies.get(
            `${checkNetwork(network)}_${request?.currencyInfo?.value}`,
        );
    }

    $: {
        currencyDetails = {
            symbol: getSymbol(
                request?.currencyInfo.network ?? "",
                request?.currencyInfo.value ?? "",
            ),
            decimals: getDecimals(
                request?.currencyInfo?.network ?? "",
                request?.currencyInfo?.value ?? "",
            ),
        };
    }

    const checkInvoice = async () => {
        try {
            unsupportedNetwork = false;
            loading = true;
            const singleRequest = await requestNetwork?.fromRequestId(
                request!.requestId,
            );
            signer = walletClientToSigner(wallet);
            requestData = singleRequest?.getData();
            let existedStreams = await checkExisted(requestData, signer);
            streamExisted = existedStreams.existed;
            latestStream = existedStreams.data?.[0];

            // Calculate progress percentage
            let startTime = latestStream.createdAtTimestamp;
            let flowRate = parseFloat(
                formatUnits(latestStream.currentFlowRate, currency?.decimals!),
            );
            let expectedAmount = parseFloat(
                formatUnits(requestData.expectedAmount, currency?.decimals!),
            );
            if (streamExisted) {
                const interval = setInterval(() => {
                    if (progress < 100) {
                        let currentTime = new Date().getTime();

                        if (startTime * 1000 < currentTime) {
                            let calculatedReleaseAmount =
                                (flowRate * (currentTime - startTime * 1000)) /
                                1000;
                            releaseAmount =
                                calculatedReleaseAmount > expectedAmount
                                    ? expectedAmount
                                    : calculatedReleaseAmount;
                            progress = Math.floor(
                                (releaseAmount / expectedAmount) * 100,
                            );
                        }
                    } else {
                        clearInterval(interval);
                    }
                }, 1000);
            }

            loading = false;
        } catch (err: any) {
            loading = false;
            if (String(err).includes("Unsupported payment")) {
                unsupportedNetwork = true;
                return;
            }
        }
    };

    const payTheRequest = async () => {
        try {
            loading = true;
            console.log("Request DATA:", requestData);
            statuses = [...statuses, "Waiting for payment"];

            let paymentTx = await payErc777StreamRequest(requestData, signer);
            await paymentTx.wait(2);

            statuses = [...statuses, "Payment detected"];
            streamExisted = true;
            statuses = [...statuses, "Payment confirmed"];
            isPaid = true;
            loading = false;
            statuses = [];
        } catch (err) {
            console.error("Something went wrong while paying : ", err);
            loading = false;
            statuses = [];
        }
    };

    const closeTheRequest = async () => {
        try {
            loading = true;
            console.log("Request DATA:", requestData);
            statuses = [...statuses, "Waiting for close"];

            let paymentTx = await closeErc777StreamRequest(requestData, signer);
            await paymentTx.wait(2);

            statuses = [...statuses, "Close the stream request"];
            streamExisted = false;
            isPaid = true;
            loading = false;
            statuses = [];
        } catch (err) {
            console.error("Something went wrong while paying : ", err);
            loading = false;
            statuses = [];
        }
    };
    const checkExisted = async (requestData: any, signer: any) => {
        return await checkExistingStream(
            requestData,
            request?.payer?.value || "",
            signer,
        );
    };

    async function switchNetworkIfNeeded(network: string) {
        try {
            console.log(requestData!);
            const targetNetworkId = String(
                getNetworkIdFromNetworkName(network),
            );
            await wallet?.provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetNetworkId }],
            });
            signer = walletClientToSigner(wallet);
            correctChain = true;
        } catch (err) {
            console.error(
                "Something went wrong while switching networks: ",
                err,
            );
        }
    }

    function getNetworkIdFromNetworkName(network: string): string {
        const networkIds: { [key: string]: string } = {
            mainnet: "0x1",
            sepolia: "0xaa36a7",
            matic: "0x89",
        };
        return networkIds[network];
    }

    // FIXME: Add rounding functionality
    function truncateNumberString(
        value: string,
        maxDecimalDigits: number,
    ): string {
        const [integerPart, decimalPart] = value.split(".");
        return decimalPart
            ? `${integerPart}.${decimalPart.substring(0, maxDecimalDigits)}`
            : value;
    }
</script>

<div
    class="invoice-view"
    style="
  --mainColor: {config.colors.main};
  --secondaryColor: {config.colors.secondary};"
>
    <div class="dates">
        <p>Issued on: {formatDate(request?.contentData?.creationDate)}</p>
        <p>Due by: {formatDate(request?.contentData?.paymentTerms?.dueDate)}</p>
    </div>
    <h2 class="invoice-number">
        Invoice #{request?.contentData?.invoiceNumber}
        <p class={`invoice-status ${isPaid ? "bg-green" : "bg-zinc"}`}>
            {isPaid ? "Paid" : "Created"}
        </p>
    </h2>
    <div class="invoice-address">
        <h2>From:</h2>
        <p>{request?.payee?.value}</p>
    </div>
    {#if sellerInfo.length > 0}
        <div class={`invoice-info bg-zinc-light`}>
            {#each sellerInfo as { label, value }}
                <p>
                    <span>{label}:</span>
                    {value}
                </p>
            {/each}
        </div>
    {/if}
    <div class="invoice-border"></div>
    <div class="invoice-address">
        <h2>Billed to:</h2>
        <p>{request?.payer?.value}</p>
    </div>
    {#if buyerInfo.length > 0}
        <div class={`invoice-info bg-zinc-light`}>
            {#each buyerInfo as { label, value }}
                <p>
                    <span>{label}:</span>
                    {value}
                </p>
            {/each}
        </div>
    {/if}

    <h3 class="invoice-info-payment">
        <span style="font-weight: 500;">Payment Chain:</span>
        {currency?.network}
    </h3>
    <h3 class="invoice-info-payment">
        <span style="font-weight: 500;">Expected start date:</span>
        {new Date(parseInt(paymentInfo.expectedStartDate)).toLocaleString()}
    </h3>
    <h3 class="invoice-info-payment">
        <span style="font-weight: 500;">Expected flow rate:</span>
        {formatUnits(paymentInfo.expectedFlowRate, currency?.decimals || 18)}
    </h3>
    <h3 class="invoice-info-payment">
        <span style="font-weight: 500;">Invoice Currency:</span>
        {currency?.symbol}
    </h3>
    <h3 class="invoice-info-payment">
        <span style="font-weight: 500;">Progress: {progress}%</span>
    </h3>
    <div class="progress-bar" style="--progress: {progress}%">
        <div class="progress">
            {releaseAmount.toFixed(4)} / {formatUnits(
                BigInt(request?.expectedAmount.toString() || "0"),
                currency?.decimals || 18,
            )}
        </div>
    </div>

    {#if request?.contentData?.invoiceItems}
        <div class="table-container">
            <table class="invoice-table">
                <thead class="table-header">
                    <tr class="table-row">
                        <th scope="col" class="table-header-cell description"
                            >Description</th
                        >
                        <th scope="col" class="table-header-cell">Qty</th>
                        <th scope="col" class="table-header-cell">Unit Price</th
                        >
                        <th scope="col" class="table-header-cell">Discount</th>
                        <th scope="col" class="table-header-cell">Tax</th>
                        <th scope="col" class="table-header-cell">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {#each firstItems as item, index (index)}
                        <tr class="table-row item-row">
                            <th scope="row" class="item-description">
                                <p class="truncate description-text">
                                    {item.name}
                                </p>
                            </th>
                            <td>{item.quantity}</td>
                            <td
                                >{formatUnits(
                                    item.unitPrice,
                                    currencyDetails.decimals,
                                )}</td
                            >
                            <td
                                >{formatUnits(
                                    item.discount,
                                    currencyDetails.decimals,
                                )}</td
                            >
                            <td>{Number(item.tax.amount)}</td>
                            <td
                                >{truncateNumberString(
                                    formatUnits(
                                        // @ts-expect-error
                                        calculateItemTotal(item),
                                        currencyDetails.decimals,
                                    ),
                                    2,
                                )}</td
                            >
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        {#if otherItems.length > 0}
            <Accordion title="View All">
                <div class="table-container">
                    <table class="invoice-table">
                        <thead
                            class="table-header hidden-header"
                            style="display: none;"
                        >
                            <tr class="table-row">
                                <th scope="col" class="table-header-cell"
                                    >Description</th
                                >
                                <th scope="col" class="table-header-cell"
                                    >Qty</th
                                >
                                <th scope="col" class="table-header-cell"
                                    >Unit Price</th
                                >
                                <th scope="col" class="table-header-cell"
                                    >Discount</th
                                >
                                <th scope="col" class="table-header-cell"
                                    >Tax</th
                                >
                                <th scope="col" class="table-header-cell"
                                    >Amount</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            {#each otherItems as item, index (index)}
                                <tr class="table-row item-row">
                                    <th scope="row" class="item-description">
                                        <p
                                            class="truncate description-text"
                                            style="margin: 4px 0;"
                                        >
                                            {item.name}
                                        </p>
                                    </th>
                                    <td>{item.quantity}</td>
                                    <td
                                        >{formatUnits(
                                            item.unitPrice,
                                            currencyDetails.decimals,
                                        )}</td
                                    >
                                    <td
                                        >{formatUnits(
                                            item.discount,
                                            currencyDetails.decimals,
                                        )}</td
                                    >
                                    <td>{Number(item.tax.amount)}</td>
                                    <td
                                        >{truncateNumberString(
                                            formatUnits(
                                                // @ts-expect-error
                                                calculateItemTotal(item),
                                                currencyDetails.decimals,
                                            ),
                                            2,
                                        )}</td
                                    >
                                </tr>
                            {/each}</tbody
                        >
                    </table>
                </div>
            </Accordion>
        {/if}
    {/if}
    {#if request?.contentData.note}
        <div class="note-container">
            <p class="note-content">
                <span class="note-title">Memo:</span> <br />
                {request.contentData.note}
            </p>
        </div>
    {/if}
    <div class="labels-container">
        {#if request?.contentData?.miscellaneous?.labels}
            {#each request?.contentData?.miscellaneous?.labels as label, index (index)}
                <div class="label">
                    {label}
                </div>
            {/each}
        {/if}
    </div>
    <div class="status-container">
        <div class="statuses">
            {#if statuses.length > 0 && loading}
                {#each statuses as status, index (index)}
                    <div class="status">
                        {status}
                        {#if (index === 0 && statuses.length === 2) || (index === 1 && statuses.length === 3)}
                            <i>
                                <Check />
                            </i>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>

        <div class="invoice-view-actions">
            {#if loading}
                <div class="loading">Loading...</div>
            {:else if !correctChain && !isPayee}
                <Button
                    type="button"
                    text="Switch Network"
                    padding="px-[12px] py-[6px]"
                    onClick={() => switchNetworkIfNeeded(network)}
                />
            {:else if streamExisted && !isPayee && !unsupportedNetwork}
                <Button
                    type="button"
                    text="Close request"
                    padding="px-[12px] py-[6px]"
                    onClick={closeTheRequest}
                />
            {:else if !streamExisted && !isPayee && !unsupportedNetwork}
                <Button
                    type="button"
                    text="Make oneoff payment"
                    padding="px-[12px] py-[6px]"
                    onClick={() => {}}
                />
                <Button
                    type="button"
                    text="Close request"
                    padding="px-[12px] py-[6px]"
                    onClick={closeTheRequest}
                />
                <Button
                    type="button"
                    text="Pay"
                    padding="px-[12px] py-[6px]"
                    onClick={payTheRequest}
                />
            {/if}
        </div>
    </div>
    {#if unsupportedNetwork}
        <div class="unsupported-network">
            Unsupported payment network: pn-eth-fee-proxy-contract
        </div>
    {/if}
</div>

<style>
    .invoice-view {
        display: flex;
        flex-direction: column;
        gap: 20px;
        background-color: white;
        width: 100%;
        height: fit-content;
    }

    .dates {
        position: absolute;
        right: 3.5rem;
    }

    .invoice-number {
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-weight: 700;
        display: flex;
        gap: 12px;
    }

    .invoice-status {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        font-size: 14px;
        font-weight: 500;
        line-height: 1;
        text-align: center;
        border-radius: 8px;
        color: #ffffff;
        width: fit-content;
        margin: 0;
    }

    .invoice-address {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .invoice-address h2 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0;
    }

    .invoice-address p {
        font-size: 0.875rem;
        margin: 0;
    }

    .invoice-info {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        padding: 0.75rem;
        width: fit-content;
    }

    .invoice-info p {
        display: flex;
        flex-direction: column;
        margin: 0;
    }

    .invoice-info p span {
        font-weight: 500;
        color: #71717a;
    }

    .invoice-border {
        border-bottom: 1px solid var(--mainColor);
        padding-bottom: 10px;
        margin-bottom: 10px;
    }

    .invoice-info-payment {
        display: flex;
        flex-direction: column;
        text-transform: capitalize;
        margin: 0;
    }

    .invoice-info-payment {
        font-size: 1rem;
        font-weight: 500;
        color: #71717a;
    }

    .invoice-info-payment span {
        color: black;
    }

    .table-container {
        position: relative;
        overflow-x: auto;
    }

    .invoice-table {
        width: 100%;
        text-align: left;
        font-size: 0.875rem;
    }

    .table-header {
        text-transform: uppercase;
        background-color: #e0e0e0;
    }

    .table-row {
        text-align: left;
    }

    .table-header-cell {
        padding: 0.75rem 0.5rem;
    }

    .table-header-cell.description {
        padding-left: 0.5rem;
    }

    .item-row {
        border-bottom: 1px solid black;
    }

    .item-description {
        padding-left: 0.5rem;
        font-weight: 500;
        white-space: nowrap;
    }

    .truncate {
        display: block;
        width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .hidden-header {
        opacity: 0;
    }

    .note-container {
        background-color: #f5f5f5;
        padding: 10px;
    }

    .note-content {
        width: fit-content;
        word-break: break-all;
    }

    .note-title {
        font-weight: 600;
    }

    .labels-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        max-width: 300px;
    }

    .label {
        display: flex;
        align-items: center;
        color: white;
        background-color: black;
        border-radius: 0.25rem;
        padding: 0.25rem;
        cursor: pointer;
    }

    .status-container {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: space-between;
        margin-top: 1rem;
    }

    .statuses {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .status {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        border-radius: 0.5rem;
        background-color: var(--mainColor);
        color: white;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .invoice-view-actions {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    :global(.invoice-view-actions button) {
        padding: 6px 14px !important;
        width: fit-content !important;
        height: fit-content !important;
    }

    .loading {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        border-radius: 0.5rem;
        background-color: var(--mainColor);
        color: white;
        animation: pulse 1s infinite;
    }

    .unsupported-network {
        font-size: 12px;
        color: #e89e14ee;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    .label {
        background-color: var(--mainColor);
    }

    .label:hover {
        background-color: var(--secondaryColor);
    }

    .bg-green {
        background-color: #0bb489;
    }

    .bg-zinc {
        background-color: #a1a1aa;
    }

    .bg-zinc-light {
        background-color: #f4f4f5;
    }

    .progress-bar {
        width: 100%;
        background-color: #f3f3f3;
        border-radius: 5px;
        overflow: hidden;
    }
    .progress {
        height: 10px;
        width: var(--progress);
        background-color: #4caf50;
        transition: width 1s;
        font-size: 8px;
        color: white;
        font-weight: bold;
        font-style: italic;
        text-align: center;
    }
</style>
