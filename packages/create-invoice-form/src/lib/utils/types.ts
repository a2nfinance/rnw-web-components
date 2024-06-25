import type { CustomFormData } from "@requestnetwork/shared";
export interface IRequestParams {
    currency: string;
    formData: CustomFormData;
    invoiceTotals: {
        amountWithoutTax: number;
        totalTaxAmount: number;
        totalAmount: number;
    };
    signer: string;
    currencies: any;
}