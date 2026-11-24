/**
 * Sandbox-aware Niubash executor — the single `ctx.shell` provider of the
 * bundle. It reuses `@deepseek-ai/dsh-pwsh-sandbox` for every mechanism that
 * must not drift (request defaulting and caps, deadlines, cause
 * classification, output capture and spill, background handles, the
 * confinement wrap and its denial/runner-failure facts) and changes exactly
 * one thing: every command runs as `niu -c <command>` instead of
 * `pwsh -Command <command>`.
 *
 * Because the seam is the capability `ctx.shell`, replacing this provider is
 * what makes Niubash the shell of *every* consumer — the model's bash tool,
 * background jobs, hooks, and in-process callers — and it does so for every
 * agent preset, official or user-defined, without patching a single preset.
 *
 * @module dsh-niubash-sandbox
 */
import { Context } from '@deepseek-ai/cordis';
import type { ShellExecRequest, ShellExecSpec } from '@deepseek-ai/dsh-shell';
import { SandboxPwshExecutor } from '@deepseek-ai/dsh-pwsh-sandbox';
import type { Config as PwshSandboxConfig } from '@deepseek-ai/dsh-pwsh-sandbox';
/**
 * Plugin config: the inherited sandbox-executor knobs verbatim plus the
 * explicit `niuPath`. The sandbox policy (mode + workspace root) is NOT here —
 * it lives on `ctx.sandboxPolicy`, resolved per call.
 */
export type Config = PwshSandboxConfig & {
    /** Explicit niu executable; PATH discovery for `niu[.exe]` when absent. */
    niuPath?: string;
};
/**
 * A Niubash-backed `ctx.shell` provider. Mount it as the one row whose service
 * is `ctx.shell`; the bash tool over `ctx.shell` then runs niu with its own
 * bash-dialect schema, so no tool row needs replacing.
 */
export declare class NiuSandboxExecutor extends SandboxPwshExecutor {
    static inject: string[];
    constructor(ctx: Context, config: Config);
    /** The niu executable every command runs through. */
    get niuPath(): string;
    /** Apply the bash-dialect terminal default (`TERM=dumb`) like `dsh-bash-local`. */
    resolve(request: ShellExecRequest): ShellExecSpec;
    /**
     * The exact argv one command runs as — the argv seam the inherited
     * `confine`/`execute` wrap, so both the confined and the full-access path
     * spawn niu rather than pwsh.
     * @param spec - the resolved execution spec.
     * @returns the niu `-c` argv.
     */
    protected argv(spec: ShellExecSpec): string[];
}
export default NiuSandboxExecutor;
