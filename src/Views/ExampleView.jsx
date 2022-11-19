// component example
import { Text, Anchor, Space, Button, Title, TextInput } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';

import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri'
import { notify, RUNNING_IN_TAURI, useMinWidth, useStorage } from '../utils';

export default function ExampleView() {
    const { t } = useTranslation();
    const [data, setData, loading] = useStorage('exampleKey', '');

    useMinWidth(1000);

    // fs example
    async function createFile() {
        // run only in desktop/tauri env
        if (RUNNING_IN_TAURI) {
            // https://tauri.app/v1/api/js/modules/fs
            const downloadDirPath = await downloadDir();
            const filePath = `${downloadDirPath}/example_file.txt`;
            await writeTextFile('example_file.txt', 'oh this is from TAURI! COOLIO.\n', { dir: BaseDirectory.Download });
            // NOTE: https://github.com/tauri-apps/tauri/issues/4062
            await open(downloadDirPath);
            await invoke('process_file', {filepath: filePath}).then(msg => {
                console.log(msg === "Hello from Rust!")
                notify('Message From Rust', msg);
            });
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
            <TextInput label={t('Persistent data')} value={data} onChange={e => setData(e.currentTarget.value)} />
        </>
        // TODO: FAQ search box
    );
}
