// component example
import { Text, Anchor, Space, Button, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';

import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { getCurrent, currentMonitor } from '@tauri-apps/api/window'
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri'

export default function ExampleView() {
    const { t } = useTranslation();

    // run only in desktop/tauri env
    if (window.__TAURI__ !== undefined) {
        useEffect(() => {
            async function resizeWindow() {
                // to set a size consistently accrosss devices,
                //  one must use LogicalSize (Physical cannot be relied upon)
                const physicalSize = await getCurrent().innerSize();
                // Since innerSize returns Physical size, we need
                //   to get the current monitor scale factor
                //   to convert the physical size into a logical size
                const monitor = await currentMonitor();
                const scaleFactor = monitor.scaleFactor;
                const logicalSize = physicalSize.toLogical(scaleFactor);
                const minWidth = 1750;
                if (logicalSize.width < minWidth) {
                    logicalSize.width = minWidth;
                    await getCurrent().setSize(logicalSize);
                }
            }
            resizeWindow().catch(console.error);
        }, []); // [] to ensure on first render
    }

    // fs example
    async function createFile() {
        // run only in desktop/tauri env
        if (window.__TAURI__ !== undefined) {
            // https://tauri.app/v1/api/js/modules/fs
            const downloadDirPath = await downloadDir();
            const filePath = `${downloadDirPath}/example_file.txt`;
            await writeTextFile('example_file.txt', 'oh this is from TAURI! COOLIO.\n', { dir: BaseDirectory.Download });
            // NOTE: https://github.com/tauri-apps/tauri/issues/4062
            await open(downloadDirPath);
            await invoke('process_file', {filepath: filePath}).then(msg => console.log(msg === "Hello from Rust!"));
        }
    }

    return (
        // this is an alias for <React.Fragment>
        <>
            <Text>{ t('Modern Desktop App Examples') }</Text>
            <Space h={'md'}/>
            <Button onClick={createFile}>Do something with fs</Button>
            <Title order={4}>{ t('Interpolating components in translations') } </Title>
            <Trans i18nKey='transExample'
                values={{variable: '/elibroftw/modern-desktop-template'}}
                components={[<Anchor href="https://github.com/elibroftw/modern-desktop-app-template" />]}
                // optional stuff:
                default='FALLBACK if key does not exist. This template is located on <0>github.com{{variable}}</0>' t={t} />
        </>
        // TODO: FAQ search box
    );
}
