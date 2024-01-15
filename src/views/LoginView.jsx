import { Box, Button, Center, Group, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { HEADER_TITLE } from '../common/utils';

export default function Login({ setLogin }) {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            account: '',
            email: '',
        },
    });

    const handleSubmit = values => {
        console.log(values);
    }

    const accountProps = form.getInputProps('account');
    let accountNumber = accountProps.value;
    let accountError = (accountNumber === '' || !isNaN(accountNumber) && !isNaN(parseFloat(accountNumber))) ? undefined : t('accountInputError');

    return <>
        <Center style={{ height: '15vh', marginTop: '15vh' }}>
            <Title>{HEADER_TITLE}</Title>
        </Center>
        {/* TODO show logo */}
        <Center style={{ height: '50vh' }}>
            <Box maw={400} mx='auto' w='30vw'>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput required autoFocus label={t('Account Number')} placeholder='XXXXXXXXXXXXXXXXXXX' {...form.getInputProps('account')} error={accountError} />
                    {/* <TextInput required mt='md' label='Email' placeholder='Email' {...form.getInputProps('email')} /> */}
                    <Group justify='center' mt='xl'>
                        <Button type='submit' variant='outline' w="100%">{t('Login')}</Button>
                    </Group>
                </form>
            </Box>
        </Center>
    </>;
}
