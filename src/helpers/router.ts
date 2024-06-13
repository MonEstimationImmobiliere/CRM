import { RouteLocationNormalized, RouteLocationRaw } from "vue-router";

import env from "@confero/common/config/env";

import { acquireTokenOrLogout, handleRedirectPromise, handleRedirectPromiseOrLogout, isUserLoggedIn, userInfo } from "../config/auth";
import { Axios } from "../config/axios";
import { NETWORK_ERROR_ROUTE_NAME } from "../constants/common";
import { useUserStore } from "../store/userStore";
import { RouteMetaGuard } from "../types/router";

export const authGuard = async (to: RouteLocationNormalized): Promise<boolean | RouteLocationRaw> => {
  try {
    await handleRedirectPromise();
  } catch (error) {
    console.error("handle redirect promise failed", error);
  }
  if (isUserLoggedIn()) await acquireTokenOrLogout();

  if (to.meta.requiresAuth !== false || to.hash.startsWith("#state=")) {
    /////////////////////////////////////////////
    // check redirect auth from auth flow
    /////////////////////////////////////////////
    const tokenAcquiredFromRedirectAuth = await handleRedirectPromiseOrLogout();
    if (tokenAcquiredFromRedirectAuth) {
      window.location.replace(`${env.VITE_APP_BASE_PATH}${to.path.replace(/^\//, "")}`);

      // to skip console error navigation guard
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return new Promise((): void => {});
    }

    /////////////////////////////////////////////
    // check JWT already set
    /////////////////////////////////////////////
    const isCurrentlySetJWTValid = Axios.isCurrentlySetJWTValid();
    if (isCurrentlySetJWTValid) return true;

    /////////////////////////////////////////////
    // acquire new token if not set
    /////////////////////////////////////////////
    await acquireTokenOrLogout({
      redirectUri: `${env.VITE_APP_BASE_PATH}${to.path.replace(/^\//, "")}`
    });
  }

  return true;
};

export const loadUserGuard = async (to: RouteLocationNormalized): Promise<boolean | RouteLocationRaw> => {
  const {
    isUserLoaded,
    loadUser,
    impersonificationToken,
    impersonifierAzureADUserID,
    clearCurrentUserImpersonification
  } = useUserStore();

  if (to.meta.requiresAuth !== false || isUserLoggedIn() && !isUserLoaded) {
    try {
      // get user info from token
      const authUser = userInfo();
      if (!authUser) throw new Error("user info not found");

      /////////////////////////////////////////////
      // check impersonification token
      /////////////////////////////////////////////
      if (impersonificationToken) {
        // if token not used by source impersonifier, clear it, otherwise set it in axios
        const { account: { localAccountId: tokenAzureADUserID } } = authUser;

        if (impersonifierAzureADUserID !== tokenAzureADUserID) clearCurrentUserImpersonification();
        else Axios.setImpersonificationToken(impersonificationToken);
      }

      /////////////////////////////////////////////
      // load user details
      /////////////////////////////////////////////
      if (!isUserLoaded) {
        await loadUser();
      }
    } catch (error) {
      console.error("load user details failed", error);
      return { name: NETWORK_ERROR_ROUTE_NAME, query: { show: "1" } };
    }
  }

  return true;
};

export const beforeEachGuards = async (to: RouteLocationNormalized, from: RouteLocationNormalized): Promise<boolean | RouteLocationRaw> => {
  if (to.meta.skipGuards) return true;

  const authGuardResult = await authGuard(to);
  if (authGuardResult !== true) return authGuardResult;

  const loadUserGuardResult = await loadUserGuard(to);
  if (loadUserGuardResult !== true) return loadUserGuardResult;

  const guards = to.matched
    .map((route): unknown => route.meta.guard)
    .filter((guard): guard is RouteMetaGuard => guard !== undefined);

  for (const guard of guards) {
    const guardResult = await guard(to, from);
    if (guardResult !== true) return guardResult;
  }

  return true;
};
