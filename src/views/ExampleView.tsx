// component example
import { Anchor, Button, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import * as fs from '@tauri-apps/plugin-fs';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import * as shell from '@tauri-apps/plugin-shell';
import { Trans, useTranslation } from 'react-i18next';
import { notify } from '../common/utils';
import { createStorage } from '../tauri/storage';
import { APP_NAME, RUNNING_IN_TAURI, useMinWidth, useTauriContext } from '../tauri/TauriProvider';

function toggleFullscreen() {
	const appWindow = getCurrentWebviewWindow();
	appWindow.isFullscreen().then(x => appWindow.setFullscreen(!x));
}

export default function ExampleView() {
	const { t } = useTranslation();
	const { fileSep, documents, downloads } = useTauriContext();
	// store-plugin will create necessary directories
	const storeName = `${documents}${APP_NAME}${fileSep}example_view.dat`;
	// const storeName = 'data.dat';
	const { use: useKVP, loading, data } = createStorage(storeName);
	const [exampleData, setExampleData] = useKVP('exampleKey', '');

	useMinWidth(1000);

	// fs example
	async function createFile() {
		// run only in desktop/tauri env
		if (RUNNING_IN_TAURI) {
			// https://tauri.app/v1/api/js/modules/fs
			const filePath = `${downloads}/example_file.txt`;
			await fs.writeTextFile('example_file.txt', 'oh this is from TAURI! COOLIO.\n', { baseDir: fs.BaseDirectory.Download });
			// show in file explorer: https://github.com/tauri-apps/tauri/issues/4062
			await shell.open(downloads!);
			await invoke('process_file', { filepath: filePath }).then(msg => {
				notify('Message from Rust', msg as string);
				notifications.show({ title: 'Message from Rust', message: msg as string });
			});
		}
	}
	// <> is an alias for <React.Fragment>
	return <Stack>
		<Text>{t('Modern Desktop App Examples')}</Text>

		<Button onClick={createFile}>Do something with fs</Button>

		<Button onClick={toggleFullscreen}>Toggle Fullscreen</Button>

		<Button onClick={() => notifications.show({ title: 'Mantine Notification', message: 'test v6 breaking change' })}>Notification example</Button>

		<Title order={4}>Interpolating components in translations</Title>
		<Trans i18nKey='transExample'
			values={{ variable: 'github.com/elibroftw/modern-desktop-template' }}
			components={[<Anchor href='https://github.com/elibroftw/modern-desktop-app-template' />]}
			// optional stuff:
			default='FALLBACK if key does not exist. This template is from <0>github.com{{variable}}</0>' t={t} />

		{loading ? <Text>Loading Tauri Store</Text> :
			<>
				<TextInput label={'Persistent data'} value={exampleData} onChange={e => setExampleData(e.currentTarget.value)} />
				<Button onClick={() => revealItemInDir(storeName)}>Reveal store file in file directory</Button>
			</>
		}
	</Stack>
}
