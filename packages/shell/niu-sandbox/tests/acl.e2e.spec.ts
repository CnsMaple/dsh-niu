/** Opt-in real Windows ACL provider test; only scratch directories receive grants. */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SandboxLocal from '@deepseek-ai/dsh-sandbox-local'
import { SandboxPolicyService } from '@deepseek-ai/dsh-sandbox-policy'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { resolveNiuPath } from 'dsh-niubash-sandbox/resolve'
import { NiuSandboxExecutor } from '../src/index.ts'

const enabled = process.platform === 'win32' && process.env.DSH_NIU_ACL_E2E === '1'

describe.skipIf(!enabled)('real Windows ACL provider', () => {
  it('allows workspace writes, denies outside writes, and denies read-only writes', { timeout: 60_000 }, async () => {
    expect(spawnSync(resolveNiuPath(), ['-c', 'exit 0']).status).toBe(0)
    // Workspace and outside are separate scratch siblings. Never grant the user's project.
    const workspace = mkdtempSync(join(tmpdir(), 'niu-acl-workspace-'))
    const outside = mkdtempSync(join(tmpdir(), 'niu-acl-outside-'))
    const ctx = new Context()
    const quote = (path: string) => `'${path.replace(/\\/g, '/')}'`
    try {
      await ctx.plugin(SessionProjectionRegistry)
      await ctx.plugin(SandboxLocal)
      await ctx.plugin(SandboxPolicyService, { mode: 'workspace-write', workspaceRoot: workspace })
      await ctx.plugin(LocalSubprocessRuntime)
      await ctx.plugin(NiuSandboxExecutor)
      const run = async (command: string, mode: 'read-only' | 'workspace-write') => {
        const execution = await ctx.shell.execute(ctx.shell.resolve({ command, workdir: workspace, sandboxPolicy: { mode, workspaceRoot: workspace } }))
        return execution.result()
      }
      const insideFile = join(workspace, 'allowed.txt')
      const outsideFile = join(outside, 'denied.txt')
      const readonlyFile = join(workspace, 'readonly-denied.txt')
      const allowed = await run(`echo allowed > ${quote(insideFile)}`, 'workspace-write')
      expect(allowed.exitCode).toBe(0)
      expect(allowed.sandbox).toEqual({ mode: 'workspace-write', denied: false, enforcement: 'partial' })
      expect(readFileSync(insideFile, 'utf8').trim()).toBe('allowed')
      const denied = await run(`echo denied > ${quote(outsideFile)}`, 'workspace-write')
      expect(denied.exitCode).not.toBe(0)
      expect(denied.sandbox).toMatchObject({ mode: 'workspace-write', denied: true, enforcement: 'partial' })
      expect(existsSync(outsideFile)).toBe(false)
      const readOnly = await run(`echo denied > ${quote(readonlyFile)}`, 'read-only')
      expect(readOnly.exitCode).not.toBe(0)
      expect(readOnly.sandbox).toMatchObject({ mode: 'read-only', denied: true, enforcement: 'partial' })
      expect(existsSync(readonlyFile)).toBe(false)
    } finally {
      await ctx.fiber.dispose()
      rmSync(workspace, { recursive: true, force: true })
      rmSync(outside, { recursive: true, force: true })
    }
  })
})
