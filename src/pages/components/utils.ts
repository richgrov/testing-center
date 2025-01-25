import { pocketBase } from "../../pocketbase";
export interface FetchForwardRequest {
  url: URL | string;
  method: string;
  headers: Record<string, string>;
  body: string;
}
export interface FetchForwardResponse {
  status: number;
  headers: Record<string, string[]>;
  body: string | null | undefined;
}
export function fetchForward(request: FetchForwardRequest): Promise<FetchForwardResponse> {
  return pocketBase.send("/api/superUserFetchForward", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export async function* paginatedCanvasRequest<T>(initialRequest: FetchForwardRequest, transformer: (response: FetchForwardResponse) => (T[] | Promise<T[]>)) {
  var next: FetchForwardRequest | null = initialRequest;
  while (next != null) {
    console.log(next.url);
    const response = await fetchForward(next);
    var nextUrl = null;
    for (const header in response.headers) {
      if (header.toLowerCase() === "link") {
        const linkHeaderParser = /<([^>]+)>; rel=\"([^\"]+)\",?/g;
        for (const link of response.headers[header]) {
          let match;
          while ((match = linkHeaderParser.exec(link)) !== null) {
            if (match[2] === "next") {
              nextUrl = match[1];
              break;
            }
          }
        }
        break;
      }
    }
    next = nextUrl != null ? {
      method: "GET",
      url: nextUrl,
      body: "",
      headers: next.headers,
    } : null;
    for (const value of await transformer(response)) {
      yield value;
    }
  }
}
