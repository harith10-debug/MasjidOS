export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path = "/") {
  if (!path) return basePath || "/";
  if (
    path.startsWith("#") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  ) {
    return path;
  }
  if (path === "/") return basePath || "/";
  if (path.startsWith("/")) return `${basePath}${path}`;
  return path;
}
