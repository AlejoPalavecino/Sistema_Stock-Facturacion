
// TODO: Implement ARCA (AFIP Web Services) integration

export interface ArcaAuth {
  cuit: string;
  certPath: string;
  keyPath: string;
}

export interface ArcaConfig {
  baseUrl: string;
}

export const arcaService = {
  // TODO: loginWSAA, generarComprobanteWSFE, etc.
};
