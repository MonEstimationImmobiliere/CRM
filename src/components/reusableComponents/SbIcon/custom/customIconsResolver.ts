import { customIcons } from "./icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customIconsResolver = (iconName: string): any => {
  const customIconImportPromise = customIcons[iconName];
  if (!customIconImportPromise) throw new Error(`Could not find custom icon "${iconName}", it either misspelled or it has not been registered`);
  return customIconImportPromise;
};