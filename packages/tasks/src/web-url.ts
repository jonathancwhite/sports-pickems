export function getWebBaseUrl(): string {
  const url = process.env.WEB_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("WEB_URL is not set");
    }
    return "http://localhost:5173";
  }
  return url.replace(/\/$/, "");
}

export function getPicksUrl(leagueId: string): string {
  return `${getWebBaseUrl()}/leagues/${leagueId}/picks`;
}
