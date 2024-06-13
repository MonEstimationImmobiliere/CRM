import * as elementIcons from "./icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const elementIconsResolver = (iconName: string): any => {
  const elementIconImport = elementIcons[iconName];
  if (!elementIconImport) throw new Error(`Could not find Element-Plus icon "${iconName}", it either misspelled or it has not been registered`);
  return elementIconImport;
};
