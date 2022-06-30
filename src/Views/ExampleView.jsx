// component example
import { Text, Anchor, Space, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/shell';
export default function ExampleView() {
    const { t } = useTranslation();

    // fs example
    async function createFile() {
        // https://tauri.app/v1/api/js/modules/fs
        const downloadDirPath = await downloadDir();
        // const filePath = `${downloadDirPath}/example_file.txt`;
        await writeTextFile('example_file.txt', 'oh this is from TAURI! COOLIO.\n', { dir: BaseDirectory.Download });
        // NOTE: https://github.com/tauri-apps/tauri/issues/4062
        await open(downloadDirPath);
    }

    return (
        // this is an alias for <React.Fragment>
        <>
            <Text>{ t('Modern Desktop App Examples') }</Text>
            <Space h={'md'}/>
            <Button onClick={createFile}>Do something with fs</Button>
        </>
        // TODO: FAQ search box
    );
}
