import * as React from 'react';
import { DefaultSession } from 'next-auth';

// ─── NextAuth Type Augmentation ───────────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
  interface User {
    role?: string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'twisty-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        alg?: string;
        scramble?: string;
        visualization?: string;
        background?: string;
        'control-panel'?: string;
        [key: string]: any;
      };
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'twisty-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          alg?: string;
          scramble?: string;
          visualization?: string;
          background?: string;
          'control-panel'?: string;
          [key: string]: any;
        };
      }
    }
  }
}
