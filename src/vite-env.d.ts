/// <reference types="vite/client" />

declare module '*?script' {
  const src: string;
  export default src;
}

declare module '*?script&module' {
  const src: string;
  export default src;
}

interface Window {
  __autoLocatorAnalyze?: (settings: import('./src/shared/types').UserSettings) => Promise<
    import('./src/shared/types').AnalysisResult
  >;
}
