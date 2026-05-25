declare module "react-native-config" {
  export interface NativeConfig {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    [key: string]: string | undefined;
  }
  export const Config: NativeConfig;
  export default Config;
}

declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.jpeg" {
  const value: any;
  export default value;
}

declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
