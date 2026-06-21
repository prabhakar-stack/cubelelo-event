import * as React from 'react';

type TwistyPlayer = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  alg?: string;
  scramble?: string;
  visualization?: string;
  background?: string;
  'control-panel'?: string;
  [key: string]: any;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'twisty-player': TwistyPlayer;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'twisty-player': TwistyPlayer;
      }
    }
  }
}

export {};
