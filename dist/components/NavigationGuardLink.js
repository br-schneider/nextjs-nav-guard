"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationGuardLink = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const NavigationGuardProviderContext_1 = require("./NavigationGuardProviderContext");
const confirmNavigation_1 = require("../utils/confirmNavigation");
exports.NavigationGuardLink = (0, react_1.forwardRef)(function NavigationGuardLink({ onClick, onNavigate, replace, scroll, ...props }, ref) {
    const guards = (0, react_1.useContext)(NavigationGuardProviderContext_1.NavigationGuardProviderContext);
    const router = (0, react_1.useContext)(NavigationGuardProviderContext_1.OriginalAppRouterContext);
    return ((0, jsx_runtime_1.jsx)(link_1.default, { ...props, ref: ref, replace: replace, scroll: scroll, "data-navigation-guard": "managed", onClick: (event) => {
            onClick === null || onClick === void 0 ? void 0 : onClick(event);
            const link = event.currentTarget;
            if (event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                link.hasAttribute("download") ||
                (link.target && link.target !== "_self"))
                return;
            const href = link.getAttribute("href");
            if (!href)
                return;
            const url = new URL(link.href);
            if (url.origin !== location.origin || !/^https?:$/.test(url.protocol))
                return;
            let cancelled = false;
            onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate({
                preventDefault: () => {
                    cancelled = true;
                },
            });
            if (cancelled) {
                event.preventDefault();
                return;
            }
            if (href.startsWith("#"))
                return;
            const params = {
                to: href,
                type: replace ? "replace" : "push",
            };
            if (!guards || !router || !(0, confirmNavigation_1.hasEnabledGuards)(guards.current, params))
                return;
            event.preventDefault();
            void (0, confirmNavigation_1.confirmNavigation)(guards.current, params).then((accepted) => {
                if (accepted && link.isConnected)
                    router[params.type](url.href, { scroll });
            });
        } }));
});
