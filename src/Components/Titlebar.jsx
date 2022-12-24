import { createStyles, Menu, Text, UnstyledButton } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import { appWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from 'react-icons/vsc';
import AppIcon from '../../src-tauri/icons/32x32.png';

export function Titlebar() {
    const { t } = useTranslation();
    const { classes } = getTitleBarStyles();
    const [maximized, setMaximized] = useState(false);
    const [windowTitle, setWindowTitle] = useState('TitleBar.jsx Title');

    const tauriInterval = useInterval(() => {
        appWindow.isMaximized().then(setMaximized);
        appWindow.title().then(setWindowTitle);
    }, 200);

    useEffect(() => {
        tauriInterval.start();
        return tauriInterval.stop;
    }, []);

    return <div data-tauri-drag-region className={classes.titlebar}>
        <div>
            {/* window icon */}
            <Menu shadow='md' width={200}>
                <Menu.Target>
                    <UnstyledButton style={{ cursor: 'default' }}><img className={classes.titlebarIcon} height={16} src={AppIcon} /></UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={() => appWindow.minimize()} icon={<VscChromeMinimize size={14} />}>{t('Minimize')}</Menu.Item>
                    {maximized ?
                        <Menu.Item onClick={() => appWindow.toggleMaximize()} icon={<VscChromeRestore size={14} />}>{t('Restore Down')}</Menu.Item> :
                        <Menu.Item onClick={() => appWindow.toggleMaximize()} icon={<VscChromeMaximize size={14} />}>{t('Maximize')}</Menu.Item>}
                    <Menu.Divider />
                    <Menu.Item onClick={() => appWindow.close()} icon={<VscChromeClose size={14} />} rightSection={
                        <Text weight='bold' size='xs'>Alt + F4</Text>}>{t('Close')}</Menu.Item>
                </Menu.Dropdown>
            </Menu>
            {/* left window title */}
            <Text data-tauri-drag-region inline className={classes.titlebarLabel} size='xs'>{windowTitle}</Text>
        </div>
        {/* center window title */}
        {/* <Text data-tauri-drag-region inline className={classes.titlebarLabel} size='xs'>{windowTitle}</Text> */}
        <div>
            {/* window icons */}
            <div title={t('Minimize')} className={classes.titlebarButton} onClick={() => appWindow.minimize()}>
                <VscChromeMinimize className={classes.verticalAlign} />
            </div>
            {maximized ?
                <div title={t('Restore Down')} className={classes.titlebarButton} onClick={() => appWindow.toggleMaximize()}>
                    <VscChromeRestore className={classes.verticalAlign} />
                </div> :
                <div title={t('Maximize')} className={classes.titlebarButton} onClick={() => appWindow.toggleMaximize()}>
                    <VscChromeMaximize className={classes.verticalAlign} />
                </div>
            }
            <div title={t('Close')} className={`${classes.titlebarClose} ${classes.titlebarButton}`} onClick={() => appWindow.close()}>
                <VscChromeClose className={classes.verticalAlign} />
            </div>
        </div>
    </div>;
}

const getTitleBarStyles = createStyles(theme => ({
    titlebar: {
        height: 30,
        background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1],
        // background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : 'white',
        display: 'flex',
        justifyContent: 'space-between',
        position: 'fixed',
        userSelect: 'none',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        '>div:nth-of-type(2)': {
            display: 'flex',
            justifyContent: 'flex-end',
        }
    },
    titlebarIcon: {
        marginLeft: 5,
        verticalAlign: 'bottom',
        filter: theme.colorScheme === 'dark' ? '' : 'grayscale(100%) contrast(0)'
    },
    titlebarLabel: {
        display: 'inline',
        marginLeft: 5,
        // marginLeft: 46 * 2,  // for center labels
        lineHeight: '30px'
    },
    verticalAlign: {
        verticalAlign: 'middle'
    },
    titlebarButton: {
        transitionDuration: '200ms',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        '>svg': {
            fill: theme.colorScheme === 'dark' ? 'white' : 'black',
        },
        width: 46,
        height: 30,
        '&:hover': {
            background: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3],
            '&:active': {
                background: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[4],
            }
        }
    },
    titlebarClose: {
        '&:hover': {
            background: '#e81123',
            '>svg': {
                fill: 'white'
            },
            '&:active': {
                background: theme.colorScheme === 'dark' ? '#8b0a14' : '#f1707a',
            }
        }
    }
}));
