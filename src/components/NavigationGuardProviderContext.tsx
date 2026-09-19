"use client";

import { createContext, type MutableRefObject } from "react";
import { AppRouterLike, GuardDef } from "../types";

export const OriginalAppRouterContext = createContext<AppRouterLike | null>(null);

export const NavigationGuardProviderContext = createContext<
  MutableRefObject<Map<string, GuardDef>> | undefined
>(undefined);
NavigationGuardProviderContext.displayName = "NavigationGuardProviderContext";
