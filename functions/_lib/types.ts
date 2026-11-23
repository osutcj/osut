export interface PagesEnv {
  ADMIN_PASSWORD?: string;
  BLOB_READ_WRITE_TOKEN?: string;
  ASSETS: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
}

export interface PagesContext<P = Record<string, string>> {
  request: Request;
  env: PagesEnv;
  params: P;
  next: () => Promise<Response>;
}
