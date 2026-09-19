"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationGuardProviderContext = exports.OriginalAppRouterContext = void 0;
const react_1 = require("react");
exports.OriginalAppRouterContext = (0, react_1.createContext)(null);
exports.NavigationGuardProviderContext = (0, react_1.createContext)(undefined);
exports.NavigationGuardProviderContext.displayName = "NavigationGuardProviderContext";
