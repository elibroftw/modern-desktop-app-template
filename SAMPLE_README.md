# APP NAME

Description goes here.

## Environment

- This project was bootstrapped with Create React App and converted to use Vite.
- [Tauri Prerequisites](https://tauri.studio/docs/getting-started/prerequisites),
- `npm i -g yarn`
- Run `yarn` to install frontend dependencies

## Resources

- [Mantine](https://mantine.dev/core/anchor/)
- [Tauri (JS)](https://tauri.studio/docs/api/js/)
- [Tauri (Rust)](https://docs.rs/tauri/1.0.0-rc.4/)
- [React Icons](https://react-icons.github.io/react-icons)

## Scripts in `package.json`

### `yarn dev`

An alias for `yarn tauri dev` which runs `yarn start` and opens a debug enabled window app that renders the frontend.

### `yarn rls`

An alias for `yarn tauri build` which builds the frontend and bundles it into a Tauri release build

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

## Trouble Shooting

If there are issues with sub-dependencies, you can use `resolutions: {}` to freeze versions until dev/building works.

Add `"devtools"` to Tauri features in `Cargo.toml` to get devtools in a production build

If a cookie is not being set from cross-site, add `SameSite: 'lax'` when
setting cookies.
