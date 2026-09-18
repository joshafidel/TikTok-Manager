/**
 * What this running instance was actually built from.
 *
 * Vercel injects these at build time. Surfacing them turns "I don't see my
 * changes" into a checkable fact: compare the commit here against the commit
 * you pushed. They differ when a build failed, when an older deployment was
 * redeployed, or when you are looking at a different deployment than you think.
 */
export type BuildInfo = {
  commit: string;
  shortCommit: string;
  branch: string;
  message: string;
  env: string;
  url: string;
};

export function buildInfo(): BuildInfo {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  return {
    commit,
    shortCommit: commit ? commit.slice(0, 7) : "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "",
    // "production" vs "preview" answers whether this is the URL you think it is.
    env: process.env.VERCEL_ENV ?? "development",
    url: process.env.VERCEL_URL ?? "",
  };
}
