import { createDefine } from "fresh";

export interface State {
  session?: {
    userId?: string;
    [key: string]: unknown;
  };
}

export const define = createDefine<State>();
