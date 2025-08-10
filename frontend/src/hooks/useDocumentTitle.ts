import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useDocumentTitle = (titleKey?: string) => {
  const { t } = useTranslation();

  useEffect(() => {
    const title = titleKey ? t(titleKey) : t('header.brandName') + ' - ' + t('hero.title');
    document.title = title;
  }, [t, titleKey]);
};
