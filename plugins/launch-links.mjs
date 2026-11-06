export function launchLinks(editUrl, binder) {
  if (!editUrl || !binder?.repo) return undefined;
  const source = new URL(editUrl);
  const [, owner, repository, action] = source.pathname.split('/');
  if (source.hostname !== 'github.com' || !['edit', 'blob'].includes(action)) return undefined;
  const ref = binder.ref ?? 'main';
  const prefix = `/${owner}/${repository}/${action}/${ref}/`;
  if (!source.pathname.startsWith(prefix)) return undefined;
  const file = source.pathname.slice(prefix.length);
  const repo = binder.repo.replace(/^https:\/\/github.com\//, '').replace(/\.git\/?$/, '').replace(/\/$/, '');
  const host = (binder.url ?? 'https://mybinder.org').replace(/\/$/, '');
  const binderUrl = new URL(`${host}/v2/gh/${repo}/${encodeURIComponent(ref)}`);
  binderUrl.searchParams.set('urlpath', `lab/tree/${decodeURIComponent(file)}`);
  return {
    binder: binderUrl.href,
    colab: `https://colab.research.google.com/github/${owner}/${repository}/blob/${ref}/${file}`,
  };
}
