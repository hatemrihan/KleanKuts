declare module 'split-type' {
  interface SplitTypeOptions {
    types?: string;
    tagName?: string;
  }

  class SplitType {
    constructor(element: Element | string, options?: SplitTypeOptions);
  }

  export default SplitType;
} 