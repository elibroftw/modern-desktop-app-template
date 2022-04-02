# Modern Desktop App Template

Tauri and ReactJS boilerplate for a modern desktop application. Not a project nor a substitute tutorial for my video tutorials. I didn't use yew (wasm) since its component libraries are not to the calibre of existing ReactJS component libraries.

TODO: make this template into a downloadable one

## RSS of Commit History

Add https://github.com/elibroftw/modern-desktop-app-template/commits.atom to your RSS reader to stay up to date!

## Instructions

1. Follow only the Tauri [prerequisites](https://tauri.studio/docs/getting-started/prerequisites)
2. Install yarn with `npm i -g yarn`
3. Create the frontend project with `yarn create vite APP-NAME --template react[-ts]` and enter a package-name if you have to
4. Run `yarn add -D @tauri-apps/cli && yarn tauri init`
5. Now copy the contents of each file in this repo (excluding `README.md` and `LICENSE.md`) into the corresponding file of your project. For example my `package.json`. 
6. Run `yarn` to install dependencies (ignore warnings)
7. Run `yarn dev` to start developing
8. If you are on a slow computer, see [tips](#tips) for a faster way to start developing
9. If any problems arise, open an issue

## Docs

- [Mantine](https://mantine.dev/core/anchor/)
- [Tauri (JS)](https://tauri.studio/docs/api/js/)
- [Tauri (Rust)](https://docs.rs/tauri/1.0.0-rc.4/)
- [React Icons](https://react-icons.github.io/react-icons)

## Tips

- Set `alwaysOnTop` to `true` in `tauri.conf.json` while developing to avoid alt tabbing
- Use `yarn py` after a single `pip install pywebview` if you do not want to wait for the Tauri dev build to compile
- Or use `yarn start` if you only need to edit the frontend
- If a sub-dependency of `package.json` is broken, use `resolutions: {subDependency: version}` to use older verisons of the sub-dependency

## Screenshots

- The four views not found in boilerplate were added by yours truly. My About is the ViewExample provided in `src`
- `Home view` is purposely not translated since it's a filler

![image](https://user-images.githubusercontent.com/21298211/160052266-9f9ea8ec-6964-4f76-bccb-2913998e5b23.png)

![image](https://user-images.githubusercontent.com/21298211/160052283-5ee37ed7-be8e-4713-bdb3-2d4279afc36f.png)
