export function draftStorageKey(key: string) {
  return `rivet:issue-draft:${key}`;
}

export function clearMarkdownDraft(draftKey: string) {
  localStorage.removeItem(draftStorageKey(draftKey));
}
