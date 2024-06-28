import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const code = url.searchParams.get('code');
  const usageExample = url.searchParams.get('usageExample');

  if (!code || !usageExample) {
    throw new Error('Missing required parameters');
  }

  return {
    code: decodeURIComponent(code),
    usageExample: decodeURIComponent(usageExample)
  };
};