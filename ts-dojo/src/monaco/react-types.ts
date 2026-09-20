import reactIndex from '../../node_modules/@types/react/index.d.ts?raw';
import reactGlobal from '../../node_modules/@types/react/global.d.ts?raw';
import reactJsxRuntime from '../../node_modules/@types/react/jsx-runtime.d.ts?raw';
import cssType from '../../node_modules/csstype/index.d.ts?raw';

/**
 * The lesson playgrounds for block 5 import from 'react'. Monaco has no file
 * system, so the type definitions are shipped with the bundle and registered
 * as extra libraries under the paths the resolver expects.
 */
export const REACT_LIBS: ReadonlyArray<{ path: string; content: string }> = [
  { path: 'file:///node_modules/csstype/index.d.ts', content: cssType },
  { path: 'file:///node_modules/@types/react/global.d.ts', content: reactGlobal },
  { path: 'file:///node_modules/@types/react/index.d.ts', content: reactIndex },
  { path: 'file:///node_modules/@types/react/jsx-runtime.d.ts', content: reactJsxRuntime },
];
