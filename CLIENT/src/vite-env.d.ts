/// <reference types="vite/client" />

// Extend Vite's existing SVG declaration to add React component support
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
}
