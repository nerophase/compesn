"use client";

import { TDraftContext } from "@compesn/shared/types/draft-context";
import { createContext } from "react";

export const DraftContext = createContext<TDraftContext | undefined>(undefined);
