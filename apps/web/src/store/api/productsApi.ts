import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { ProductSummary } from "../../lib/types";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductsByIds: builder.query<ProductSummary[], string[]>({
      query: (ids) => `/products/by-ids?ids=${ids.join(",")}`,
      transformResponse: unwrap<ProductSummary[]>,
      providesTags: ["Product"],
    }),
  }),
});

export const { useGetProductsByIdsQuery } = productsApi;
