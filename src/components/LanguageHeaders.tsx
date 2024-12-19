import { Anchor, Text } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { resources } from '../translations/i18n';

// when many languages are supported, a dropdown (Select) may be optimal
export default function LanguageHeaders() {
  const { i18n } = useTranslation();
  const languages = Object.keys(resources);
  if (languages.length == 1) return <></>;
  const lang = i18n.resolvedLanguage;
  let nextLangIdx = 0;

  function cycleLang() {
    if (nextLangIdx == languages.length) nextLangIdx = 0;
    i18n.changeLanguage(languages[nextLangIdx]);
  }

  const header = languages.map((supportedLang, index) => {
    const selectedLang = lang === supportedLang;
    if (selectedLang) nextLangIdx = index + 1;
    return <Fragment key={index}>
      {/* language code is a link if not the current language */}
      {selectedLang ?
        <Text>{supportedLang.toUpperCase()}</Text> :
        <Anchor onClick={() => i18n.changeLanguage(supportedLang)}>{supportedLang.toUpperCase()}</Anchor>}
      <Text>{index < languages.length - 1 && '|'}</Text>
    </Fragment>;
  });
  useHotkeys([['mod+Shift+L', cycleLang]]);
  return header;
}
