declare module "react-native-config" {
  export interface NativeConfig {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    [key: string]: string | undefined;
  }
  export const Config: NativeConfig;
  export default Config;
}
