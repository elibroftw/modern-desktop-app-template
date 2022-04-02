// component example
import { Text, Anchor, Space  } from '@mantine/core';
import { useTranslation } from 'react-i18next';
export default function About() {
    const { t } = useTranslation();
    return (
        // this is an alias for <React.Fragment>
        <>
            <Text>R2-T2 v2022.1 by <Anchor target="_blank" href="//lenerva.com">LeNerva Inc.</Anchor></Text>
            <Space h="sm" />
            <Text>Tech: Rust, Tauri, JavaScript, React, Mantine</Text>
            <Space h="sm" />
            <Text>{ t('applicableYears') }: 2021</Text>
            <Space h="md" />
            <Text>{ t('contactUsMessage') } <Anchor href="mailto:support@lenerva.com?subject=Regarding R2-T2">support@lenerva.com</Anchor></Text>
        </>
        // TODO: FAQ search box
    );
}
