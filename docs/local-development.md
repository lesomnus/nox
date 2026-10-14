# Local development and submodules

Nox supports three ways to consume the same public imports:

| Mode                        | Implementation                        | Build owner                                               |
| --------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Registry package or tarball | Installed `dist`                      | Nox builds before packaging; the app bundles JS/CSS       |
| Local compiled package      | Local `dist`                          | Nox's `npm run dev` rebuilds on source edits              |
| Local TSX source            | Local `src`, selected by `nox-source` | The app compiles TSX and CSS Modules; Vite can hot reload |

Keep `import { Button } from "@lesomnus/nox"` and the public stylesheet import in
all modes. The editor and terminal entries follow the same condition. A normal
`development` condition still resolves to compiled output.

## Connect a sibling checkout

```sh
# In ../nox:
npm ci
npm run build

# In the app:
npm link --no-save ../nox
```

Install the app's React 19 and React DOM 19 dependencies as usual. Install
`monaco-editor` only if the app uses `@lesomnus/nox/editor`. Linking connects the
package; it does not install Nox's development tools in the app.

For compiled mode, run `npm run dev` in Nox. It rebuilds JS, CSS and declarations
together. Changes to Nox build configuration require restarting the watcher.

## Enable source mode in a Vite app

```ts
// vite.config.ts
import { defineConfig, defaultClientConditions } from "vite";

export default defineConfig(({ mode }) => ({
  resolve: {
    conditions: [
      ...(mode === "nox-source" ? ["nox-source"] : []),
      ...defaultClientConditions,
    ],
    dedupe: ["react", "react-dom", "monaco-editor"],
  },
  optimizeDeps: { exclude: ["@lesomnus/nox"] },
}));
```

Run `vite --mode nox-source` for TSX, or `vite` for compiled output. This condition
also switches `@lesomnus/nox/styles.css` to source tokens; component CSS Modules
are imported by the TSX. No library build is needed in source mode. Consumers
need a JSX setup that supports React's automatic JSX runtime.

The app's TypeScript configuration should use `moduleResolution: "Bundler"`,
`jsx: "react-jsx"` and Vite's `vite/client` types. For source-mode checking, also
select the matching condition:

```sh
npx tsc --noEmit --customConditions nox-source
```

Alternatively, use a development tsconfig with
`"customConditions": ["nox-source"]`. Compiled-mode checks should use the normal
tsconfig so declarations are tested too. Match any existing TypeScript and JSX
settings in your application rather than replacing the entire configuration.

If a sibling checkout is outside Vite's permitted filesystem, add that checkout
to `server.fs.allow` while retaining the app workspace allowance. Submodules
inside the app normally avoid that extra filesystem setup.

## Bring Nox into an app as a submodule

```sh
# In the app repository:
git submodule add https://github.com/lesomnus/nox.git vendor/nox
git add .gitmodules vendor/nox
git commit -m "Add Nox development checkout"

# Initialize tools and link the checkout:
cd vendor/nox
npm ci
npm run build
cd ../..
npm link --no-save ./vendor/nox
```

The submodule is a separate Git repository. Before editing, create a branch
instead of working on the detached commit selected by a submodule update:

```sh
git -C vendor/nox switch -c fix/menu-focus
# Edit vendor/nox/src and validate inside the app in source mode.
cd vendor/nox
npm run check
npm test
npm run build
git add src
git commit -m "Fix menu focus"
git push -u origin fix/menu-focus
gh pr create --base main
```

That PR belongs to Nox. App changes belong to a separate app commit or PR. The
parent app records only the submodule commit, not its source files or branch.
If the app needs the new submodule commit, push the Nox commit first, then stage
`vendor/nox` in the app. A branch setting does not make the parent automatically
follow branch tips. After a squash merge, pin the merged commit if retaining the
submodule for reproducible builds.

## Return to the released package

After the Nox PR is merged and a package version is published, unlink the local
checkout and install that version in the app:

```sh
npm unlink --no-save @lesomnus/nox
npm install @lesomnus/nox@<released-version>
```

Use compiled mode and run the app's checks again. Commit the package manifest
and lockfile update. Local links should not replace the version recorded for
normal app installs or CI.

For package-based deployments, the submodule is an optional development checkout;
ordinary CI uses the installed package. If deploying directly from a submodule,
CI must fetch submodules recursively, install Nox's dependencies, build it and
connect that checkout. In this case the pinned submodule commit is the deployment
input, and must already be available on the remote.

## Useful references

- [Git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [npm link](https://docs.npmjs.com/cli/v11/commands/npm-link/)
- [Vite linked dependencies](https://vite.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies)
- [Node conditional exports](https://nodejs.org/api/packages.html#conditional-exports)
