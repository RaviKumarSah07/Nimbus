import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
  AddressInput,
} from "@ecommerce/shared";
import { baseApi } from "./baseApi";
import { unwrap } from "./unwrap";
import type { UserDto, AddressDto } from "../../lib/types-auth";

interface AuthPayload {
  user: UserDto;
  accessToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthPayload, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: unwrap<AuthPayload>,
    }),
    login: builder.mutation<AuthPayload, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: unwrap<AuthPayload>,
    }),
    refresh: builder.mutation<AuthPayload, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      transformResponse: unwrap<AuthPayload>,
    }),
    logout: builder.mutation<{ loggedOut: boolean }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: unwrap<{ loggedOut: boolean }>,
    }),
    me: builder.query<UserDto, void>({
      query: () => "/auth/me",
      transformResponse: unwrap<UserDto>,
      providesTags: ["Address"],
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordInput>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordInput>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    updateProfile: builder.mutation<UserDto, UpdateProfileInput>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      transformResponse: unwrap<UserDto>,
    }),
    changePassword: builder.mutation<{ message: string }, ChangePasswordInput>({
      query: (body) => ({ url: "/users/me/change-password", method: "POST", body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    listAddresses: builder.query<AddressDto[], void>({
      query: () => "/users/me/addresses",
      transformResponse: unwrap<AddressDto[]>,
      providesTags: ["Address"],
    }),
    createAddress: builder.mutation<AddressDto, AddressInput>({
      query: (body) => ({ url: "/users/me/addresses", method: "POST", body }),
      transformResponse: unwrap<AddressDto>,
      invalidatesTags: ["Address"],
    }),
    updateAddress: builder.mutation<AddressDto, { id: string; input: Partial<AddressInput> }>({
      query: ({ id, input }) => ({ url: `/users/me/addresses/${id}`, method: "PATCH", body: input }),
      transformResponse: unwrap<AddressDto>,
      invalidatesTags: ["Address"],
    }),
    deleteAddress: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/users/me/addresses/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: ["Address"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useListAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = authApi;
