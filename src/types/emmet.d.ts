// The emmet package ships typings its package.json "exports" doesn't expose; declare what we use.
declare module "emmet" {
  export interface UserConfig {
    type?: "markup" | "stylesheet";
    syntax?: string;
    options?: Record<string, unknown>;
  }
  export default function expand(abbr: string, config?: UserConfig): string;
  export function extract(
    line: string,
    pos?: number,
    options?: { lookAhead?: boolean; type?: "markup" | "stylesheet"; prefix?: string },
  ): { abbreviation: string; location: number; start: number; end: number } | undefined;
  export function resolveConfig(config?: UserConfig): { snippets: Record<string, string> };
}
