import type { ReactNode } from "react";

type ViewTransitionClass =
  | "none"
  | "auto"
  | string
  | Record<"default" | (string & {}), "none" | "auto" | (string & {})>;

declare module "react" {
  export interface ViewTransitionProps {
    children?: ReactNode;
    default?: ViewTransitionClass;
    enter?: ViewTransitionClass;
    exit?: ViewTransitionClass;
    name?: string;
  }

  export const ViewTransition: (props: ViewTransitionProps) => ReactNode;
}
