import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/authSlice";
import { useMergeGuestCartMutation } from "../../store/api/cartApi";
import { peekGuestCartToken, clearGuestCartToken } from "../../lib/guestCart";
import type { UserDto } from "../../lib/types-auth";

/** Shared post-login/register flow: store credentials, fold any anonymous cart into the new session, then redirect. */
export function useHandleAuthSuccess() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mergeGuestCart] = useMergeGuestCartMutation();

  return async (payload: { user: UserDto; accessToken: string }, redirectTo = "/") => {
    dispatch(setCredentials(payload));

    const guestToken = peekGuestCartToken();
    if (guestToken) {
      try {
        await mergeGuestCart({ guestToken }).unwrap();
      } finally {
        clearGuestCartToken();
      }
    }

    router.push(redirectTo);
    router.refresh();
  };
}
