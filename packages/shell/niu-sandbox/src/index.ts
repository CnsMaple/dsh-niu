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

import { Context } from '@deepseek-ai/cordis'
import type { Volatile } from '@deepseek-ai/cordis'
import type { ShellExecRequest, ShellExecSpec, ShellExecution } from '@deepseek-ai/dsh-shell'
import { SandboxPwshExecutor } from '@deepseek-ai/dsh-pwsh-sandbox'
import type { Config as PwshSandboxConfig } from '@deepseek-ai/dsh-pwsh-sandbox'
import type { SandboxPolicy, ConfinedArgv } from '@deepseek-ai/dsh-sandbox'
import { resolveNiuPath } from './resolve.ts'

/**
 * Plugin config: the inherited sandbox-executor knobs verbatim plus the
 * explicit `niuPath`. The sandbox policy (mode + workspace root) is NOT here —
 * it lives on `ctx.sandboxPolicy`, resolved per call.
 */
export type Config = PwshSandboxConfig & {
  /** Explicit niu executable; PATH discovery for `niu[.exe]` when absent. */
  niuPath?: string
}

/**
 * Project `niuPath` onto the base executor's `pwshPath` reference so the
 * inherited argv seam spawns niu. The base re-resolves whenever the
 * reference's value changes, keeping PATH discovery live against config edits.
 * @param config - the received section carrying the raw `niuPath`.
 * @returns a `pwshPath` reference resolving the niu executable.
 */
function niuExecutable(config: Config): Volatile<string | undefined> {
  return { get: () => resolveNiuPath(config.niuPath) }
}

/**
 * A Niubash-backed `ctx.shell` provider. Mount it as the one row whose service
 * is `ctx.shell`; the bash tool over `ctx.shell` then runs niu with its own
 * bash-dialect schema, so no tool row needs replacing.
 */
export class NiuSandboxExecutor extends SandboxPwshExecutor {
  static override inject = ['subprocess', 'sandbox', 'sandboxPolicy']

  constructor(ctx: Context, config: Config) {
    super(ctx, { ...config, pwshPath: niuExecutable(config) })
  }

  /** The niu executable every command runs through. */
  get niuPath(): string {
    return this.pwshPath
  }

  /** Apply the bash-dialect terminal default (`TERM=dumb`) like `dsh-bash-local`. */
  override resolve(request: ShellExecRequest): ShellExecSpec {
    const spec = super.resolve(request)
    return { ...spec, env: { TERM: 'dumb', ...spec.env } }
  }

  /**
   * The exact argv one command runs as — the argv seam the inherited
   * `confine`/`execute` wrap, so both the confined and the full-access path
   * spawn niu rather than pwsh.
   * @param spec - the resolved execution spec.
   * @returns the niu `-c` argv.
   */
  protected override argv(spec: ShellExecSpec): string[] {
    return [this.niuPath, '-c', spec.command]
  }
}

export default NiuSandboxExecutor
