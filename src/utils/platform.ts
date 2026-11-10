export interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: {
    AdMob?: {
      showRewardVideoAd: () => Promise<unknown>;
    };
    [pluginName: string]: unknown;
  };
}

export interface WindowWithCapacitor extends Window {
  Capacitor?: CapacitorGlobal;
}

export const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as unknown as WindowWithCapacitor).Capacitor?.isNativePlatform?.());
};

export const getPlatformName = (): 'android' | 'web' => {
  return isCapacitor() ? 'android' : 'web';
};
