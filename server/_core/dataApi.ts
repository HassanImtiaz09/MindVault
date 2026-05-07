// Generic Manus data API helper.
//
// M0.1 status: forge proxy removed. No in-repo callers exist; the helper is
// kept as a graceful stub so external code that imports it gets a structured
// error rather than an undefined-symbol crash.

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export type DataApiUnavailable = {
  ok: false;
  error: "DATA_API_NOT_CONFIGURED";
  reason: string;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {},
): Promise<DataApiUnavailable> {
  console.warn("[dataApi] forge proxy removed in M0.1; helper is a no-op");
  return {
    ok: false,
    error: "DATA_API_NOT_CONFIGURED",
    reason: "Generic data API helper has no transport configured. No DocVault callers exist.",
  };
}
