import Link from "next/link";
import { ComponentPropsWithoutRef } from "react";
export type NavigationGuardLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "legacyBehavior" | "onNavigate"> & {
    onNavigate?: (event: {
        preventDefault(): void;
    }) => void;
};
export declare const NavigationGuardLink: import("react").ForwardRefExoticComponent<Omit<Omit<Omit<import("react").AnchorHTMLAttributes<HTMLAnchorElement>, keyof import("next/link").LinkProps<any>> & import("next/link").LinkProps<any> & {
    children?: React.ReactNode | undefined;
} & import("react").RefAttributes<HTMLAnchorElement>, "ref">, "legacyBehavior" | "onNavigate"> & {
    onNavigate?: (event: {
        preventDefault(): void;
    }) => void;
} & import("react").RefAttributes<HTMLAnchorElement>>;
//# sourceMappingURL=NavigationGuardLink.d.ts.map