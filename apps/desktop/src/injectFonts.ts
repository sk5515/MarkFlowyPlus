import OpenSansSemiBold from '@/assets/fonts/open-sans-v15-latin_latin-ext-600.woff'
import OpenSansBold from '@/assets/fonts/open-sans-v15-latin_latin-ext-700.woff'
import OpenSansRegular from '@/assets/fonts/open-sans-v15-latin_latin-ext-regular.woff'

import FiraCode from '@/assets/fonts/FiraCode-Regular.ttf'

import { createGlobalStyle } from 'styled-components'

export const InjectFonts = createGlobalStyle`
  /*
   * Open Sans
   * Keep only common weights in the bundle. Browsers synthesize italic and uncommon weights.
   */
  @font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 400;
    src:
      local('Open Sans Regular'),
      local('OpenSans-Regular'),
      url(${OpenSansRegular}) format('woff');
  }
  @font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 600;
    src:
      local('Open Sans SemiBold'),
      local('OpenSans-SemiBold'),
      url(${OpenSansSemiBold}) format('woff');
  }
  @font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 700;
    src:
      local('Open Sans Bold'),
      local('OpenSans-Bold'),
      url(${OpenSansBold}) format('woff');
  }

  /*
 * Fira Code
 */
  @font-face {
    font-family: 'Fira Code';
    src: local('Fira Code'), url(${FiraCode});
  }
`
