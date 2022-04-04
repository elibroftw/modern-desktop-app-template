# Modern Desktop App Template

Tauri and ReactJS boilerplate for a modern desktop application. Not a project nor a substitute tutorial for my video tutorials. I didn't use yew (wasm) since its component libraries are not to the calibre of existing ReactJS component libraries.

TODO: make this template into a downloadable one

## Instructions

1. Follow only the Tauri [prerequisites](https://tauri.studio/docs/getting-started/prerequisites)
2. Download or Clone this repository `git clone --depth=1 https://github.com/elibroftw/modern-desktop-app-template.git new-app`
3. Go into `new-app`
4. Remove the `.git` folder
5. Run `yarn` to install packages
6. While `yarn` is working, edit these core files:
    - `src-tauri/tauri.conf.json's productName, identifier, title`
    - `src/App.jsx's HEADER_TITLE, FOOTER`
8. Run `yarn dev` to start developing
9. Replace README.md with `SAMPLE_README.md` and read the Tips and Trouble Shooting section
10. If any problems arise, open an issue or contact me.


## Old Instructions

1. Follow only the Tauri [prerequisites](https://tauri.studio/docs/getting-started/prerequisites)
2. Install yarn with `npm i -g yarn`
3. Create the frontend project with `yarn create vite APP-NAME --template react[-ts]` and enter a package-name if you have to
4. Run `yarn add -D @tauri-apps/cli && yarn tauri init` in the newly created directory
5. Now copy the contents of each file in this repo (excluding `README.md` and `LICENSE.md`) into the corresponding file of your project. For example my `package.json`. 
6. Run `yarn` to install dependencies (ignore warnings)
7. Run `yarn dev` to start developing


## RSS of Commit History

Add https://github.com/elibroftw/modern-desktop-app-template/commits.atom to your RSS reader to stay up to date!
I do not recommend pulling from my repo because you will need to edit the same files I reorganize

## Docs

- [Mantine](https://mantine.dev/core/anchor/)
- [Tauri (JS)](https://tauri.studio/docs/api/js/)
- [Tauri (Rust)](https://docs.rs/tauri/1.0.0-rc.4/)
- [React Icons](https://react-icons.github.io/react-icons)

## [Tips](/SAMPLE_README.md#tips-and-trouble-shooting)

## Screenshots

- The four views not found in boilerplate were added by yours truly. My About is the ViewExample provided in `src`
- `Home view` is purposely not translated since it's a filler

![image](https://user-images.githubusercontent.com/21298211/160052266-9f9ea8ec-6964-4f76-bccb-2913998e5b23.png)

![image](https://user-images.githubusercontent.com/21298211/160052283-5ee37ed7-be8e-4713-bdb3-2d4279afc36f.png)
