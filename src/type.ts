export interface Token {
  ruleName: string;
  data?: object;
  children: Token[] | string;
}

export interface parceResult {
  data?: object;
  length: number;
  inner: string;
}

export interface Rule {
  name: string;
  type: string;
  canBeChild: string[];
  parcer?(source: string): parceResult | null;
  renderer?<T = string>(token: Token, children?: T[]): T;
  /*
  renderer: {
    open(token: Token): any;
    close(token: Token): any;
  };
  */
}

export interface RuleSet {
  name: string;
  types: {
    [keys: string]: string[];
  };
  rules: {
    [keys: string]: Rule;
  };
}

export interface Option {
  parceWith: RuleSet;
  renderWith: RuleSet;
}
