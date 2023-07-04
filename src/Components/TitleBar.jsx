import { createStyles, Menu, Text, UnstyledButton } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import { appWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from 'react-icons/vsc';
import AppIcon from '../../src-tauri/icons/32x32.png';

export function TitleBar() {
  const { t } = useTranslation();
  const { classes } = getTitleBarStyles();
  const [maximized, setMaximized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [windowTitle, setWindowTitle] = useState('');

  const tauriInterval = useInterval(() => {
    appWindow.isMaximized().then(setMaximized);
    appWindow.isFullscreen().then(setFullscreen);
    appWindow.title().then(title => {
      if (windowTitle !== title) setWindowTitle(title);
    });
  }, 200);

  useEffect(() => {
    tauriInterval.start();
    return tauriInterval.stop;
  }, []);

  return !fullscreen && <div data-tauri-drag-region className={classes.titlebar} id='titlebar'>
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
      <div title={t('Minimize')} className={`${classes.titlebarButton} ${classes.titlebarDefaultHover}`} onClick={() => appWindow.minimize()}>
        <VscChromeMinimize className={classes.verticalAlign} />
      </div>
      {maximized ?
        <div title={t('Restore Down')} className={`${classes.titlebarButton} ${classes.titlebarDefaultHover}`} onClick={() => appWindow.toggleMaximize()}>
          <VscChromeRestore className={classes.verticalAlign} />
        </div> :
        <div title={t('Maximize')} className={`${classes.titlebarButton} ${classes.titlebarDefaultHover}`} onClick={() => appWindow.toggleMaximize()}>
          <VscChromeMaximize className={classes.verticalAlign} />
        </div>
      }
      <div title={t('Close')} className={`${classes.titlebarButton} ${classes.titlebarCloseHover}`} onClick={() => appWindow.close()}>
        <VscChromeClose className={classes.verticalAlign} />
      </div>
    </div>
  </div>;
}

const getTitleBarStyles = createStyles(theme => ({
  titlebarIcon: {
    marginLeft: 5,
    verticalAlign: 'bottom',
    filter: theme.colorScheme === 'dark' ? '' : 'grayscale(100%) contrast(0)'
  },
  verticalAlign: {
    verticalAlign: 'middle'
  },
  titlebarLabel: {
    display: 'inline',
    marginLeft: 5,
    // marginLeft: 46 * 3 - 16 - 7.5  // for center labels
    lineHeight: '30px'
  },
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
  titlebarDefaultHover: {
    '&:hover': {
      background: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3],
      '&:active': {
        background: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[4],
      }
    }
  },
  titlebarCloseHover: {
    '&:hover': {
      background: '#e81123',
      '>svg': { fill: 'white' },
      '&:active': {
        background: theme.colorScheme === 'dark' ? '#8b0a14' : '#f1707a',
      }
    }
  },
  titlebarButton: {
    transitionDuration: '200ms',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    '>svg': {
      fill: theme.colorScheme === 'dark' ? 'white' : 'black',
    },
    width: 47,
    height: 30
  },
}));
