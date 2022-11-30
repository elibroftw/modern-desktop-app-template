# APP NAME

Description goes here.
This project was bootstrapped with Create React App and converted to use Vite.

## Environment

- [Tauri Prerequisites](https://tauri.studio/docs/getting-started/prerequisites),
- Install [NodeJS](https://nodejs.org/en/) via [nvm](#how-to-use-nvm)
- Install `yarn` using `npm i -g yarn`
- Run `yarn` to install frontend dependencies

### How to use nvm

1. Install [`nvm`](https://github.com/nvm-sh/nvm) or [`nvm-windows`](https://github.com/coreybutler/nvm-windows/releases)
2. Open up an elevated command prompt (Windows) or use `sudo` (POSIX) for the below commands.
3. `nvm install latest` which will output a version (X.Y.Z) that was installed
4. `nvm use X.Y.Z`

## Resources

- [VS Code](https://code.visualstudio.com/) + [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer Extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [Tauri (JS)](https://tauri.studio/docs/api/js/)
- [Tauri (Rust)](https://docs.rs/tauri/)
- [React Icons](https://react-icons.github.io/react-icons)
- [Mantine Docs](https://mantine.dev/pages/basics/)
- [Mantine Default Theme](https://github.com/mantinedev/mantine/blob/master/src/mantine-styles/src/theme/default-theme.ts)
- [react-18next Trans Component](https://react.i18next.com/latest/trans-component)

### Implementing Auto-Update

[Watch Tauri Part 10](https://youtu.be/ZXjlZBisYPQ) and [read sample backend code](https://github.com/elibroftw/website/tree/master/blueprints/tauri_releases)

### Calling Rust from the Frontend

```rs
#[tauri::command]
fn command1() {
  println!("I was invoked from JS!");
}

#[tauri::command]
fn command2(arg: String) -> String {
  println!("I was invoked from JS!");
  return "hi frontend".into();
}

tauri::Builder::default()
  // ...
  .invoke_handler(tauri::generate_handler![command1, command2])
  // ...
```

```js

import { invoke } from '@tauri-apps/api/tauri'
// or const invoke = window.__TAURI__.invoke
// in an async function...
await invoke('command1');
await invoke('command2', {arg: 'two'}).then(msg => console.log(msg));
// ...
```

## Scripts in `package.json`

### `yarn dev`

An alias for `yarn tauri dev` which runs `yarn start` and opens a debug enabled window app that renders the frontend.

### `yarn rls`

An alias for `yarn tauri build` which builds the frontend and bundles it into a Tauri release build

### `yarn update`

Upgrades packages/crates in `./packages.json` and `./src-tauri/Cargo.toml`

### `yarn clean`

Installs `cargo-sweep` and cleans unused Rust build files by first **building both the debug and release versions** to test which files are outdated.

### `yarn build`

A performance optimized build of the front-end intended for use in production. Output is the `build` folder.

### `yarn start`

Run the app in the development mode ~~and opens [http://localhost:3000](http://localhost:3000) in your browser~~.
The page should reload when you make changes. You may also see lint errors in the console.

### `yarn serve`

Serve `/build` with the global `serve` package

### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

## Tips and Trouble Shooting

- Slow computer / low storage / Frontend edits only? `yarn start`
  - no Tauri API access of course
- Publishing to the web? Edit `package.json`, `index.html`, `manifest.html`
- More than 1 monitor? Set `alwaysOnTop` to `true` in `tauri.conf.json` to avoid alt-tabbing
- Broken sub-dependency? Use `resolutions: {subDependency: version}`
- Add `"devtools"` to Tauri features in `Cargo.toml` to get devtools in a production build
- If a cookie is not being set from cross-site, add `SameSite: 'lax'` when setting cookies.
- Use `cd src-tauri && cargo clean` to fix abnormal bugs or issues
- Use `cd src-tauri && cargo update` to update Cargo packages
