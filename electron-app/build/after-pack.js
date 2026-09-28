const fs = require('fs')
const path = require('path')

// AppImageHub launches the AppImage directly, so the --no-sandbox flag in the
// desktop file is never passed. Chromium then sandboxes itself inside firejail,
// fails to create shared memory, and the window stays a solid background color.
// A real argv flag and ELECTRON_DISABLE_SANDBOX are read before that sandbox starts.
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return

  const name = context.packager.executableName
  const exe = path.join(context.appOutDir, name)
  const real = `${exe}.bin`

  await fs.promises.rename(exe, real)
  await fs.promises.writeFile(
    exe,
    `#!/bin/sh
export ELECTRON_DISABLE_SANDBOX=1
exec "$(dirname "$0")/${name}.bin" --no-sandbox --disable-setuid-sandbox "$@"
`,
    { mode: 0o755 },
  )
}
