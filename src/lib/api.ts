/* Client HTTP de l'API Django : ajoute le JWT, le renouvelle automatiquement et normalise les erreurs. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000";

const ACCESS = "sl_access";
const REFRESH = "sl_refresh";

export const tokens = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(extraireMessage(data) || `Erreur ${status}`);
    this.status = status;
    this.data = data;
  }
}

/** Transforme les erreurs DRF ({champ: ["msg"]}, {detail}, {error}) en un message lisible. */
export function extraireMessage(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(extraireMessage).join(" ");
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.detail) return extraireMessage(obj.detail);
    if (obj.error) return extraireMessage(obj.error);
    return Object.entries(obj)
      .map(([k, v]) => (k === "non_field_errors" ? extraireMessage(v) : `${k} : ${extraireMessage(v)}`))
      .join(" · ");
  }
  return String(data);
}

let refreshing: Promise<boolean> | null = null;

async function rafraichir(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  refreshing ??= fetch(`${API_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const d = await r.json();
      tokens.set(d.access, d.refresh);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function api<T = unknown>(path: string, opts: Options = {}, retry = true): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) h.set("Content-Type", "application/json");
  const access = auth ? tokens.access : null;
  if (access) h.set("Authorization", `Bearer ${access}`);

  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    headers: h,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 401 && access && retry && (await rafraichir())) {
    return api<T>(path, opts, false);
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get("content-type") ?? "";
  const data = type.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

/** Télécharge un fichier protégé (attestation PDF, .ics) avec le JWT. */
export async function telecharger(path: string, nomFichier: string) {
  const h = new Headers();
  if (tokens.access) h.set("Authorization", `Bearer ${tokens.access}`);
  let res = await fetch(`${API_URL}/api${path}`, { headers: h });
  if (res.status === 401 && (await rafraichir())) {
    h.set("Authorization", `Bearer ${tokens.access}`);
    res = await fetch(`${API_URL}/api${path}`, { headers: h });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

export function wsUrl(path: string) {
  return `${WS_URL}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(tokens.access ?? "")}`;
}
