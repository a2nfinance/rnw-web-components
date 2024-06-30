import type { CustomFormData } from "@requestnetwork/shared";
import { parseUnits } from "viem";

export const generateContentDataRequest = (
    currency: any,
    formData: CustomFormData,
    currencies: any
  ): any => ({
   
    contentData: {
      meta: {
        format: "rnf_invoice",
        version: "0.0.3",
      },
      miscellaneous: {},
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
    }
  });