import { Option, Rule, RuleSet, Token, parceResult } from './type';

/**
 * NML クラス
 */
export class NML {
  parceWith: RuleSet;
  renderWith: RuleSet;
  enabledRule: Set<string>;

  /**
   * ルールセットからルールの配列を返します。
   * @param ruleset ルールセット
   * @param queries ルール名、ルールタイプの配列
   */
  static createRuleArray(ruleset: RuleSet, queries: string[]): Rule[] {
    const rules: Rule[] = [];
    for (const query of queries) {
      const additionals: Rule[] =
        (ruleset.types[query] || [query])
          .map(ruleName => ruleset.rules[ruleName])
          .filter(rule => rule != null);
      if (additionals.length !== 0) { 
        rules.push(...additionals);
      }
    }
    return rules;
   }

  /**
   * 
   * @param options
   */
  constructor({ parceWith, renderWith }: Option) {
    this.parceWith = parceWith;
    this.renderWith = renderWith;
    this.enabledRule = new Set([...Object.keys(parceWith), ...Object.keys(renderWith)]);
  }

  /**
   * 文字列をパースします。
   * @param source パースする文字列
   * @param ruleQueries パースするルールの名前の配列
   * @returns トークンの配列
   */
  parce(source: string, ruleQueries:string[] = ['root']): Token[] {
    const tokens: Token[] = [];
    const sourceLength = source.length;
    let nextIndex: number = 0;
    let buffer: string = ''

    while (nextIndex < sourceLength) {
      let token: Token|null = null;
      const rules = NML.createRuleArray(this.parceWith, ruleQueries.filter( name => this.enabledRule.has(name)))
        

      for (const rule of rules) {
        if (rule.parcer == null) continue;
        const result:parceResult|null = rule.parcer(source.slice(nextIndex));

        if (result != null) { 
          nextIndex += result.length;

          token = {
            ruleName: rule.name,
            data: result.data,
            children: this.parce(result.inner, rule.canBeChild)
          }

          break;
        }
      }

      if (token) {
        if (buffer !== "") {
          tokens.push({
            ruleName: "text",
            children: buffer
          })
          buffer = ""
        }
        tokens.push(token);
      } else { 
        buffer += source[nextIndex];
        nextIndex += 1;
      }
    }

    return tokens;
  }

  /**
   * 
   * @param token レンダリングするトークン
   * @returns レンダリング結果（ルールセットにより型は異なります））
   */
  render(token: Token): any {
    const rule = this.renderWith.rules[token.ruleName];
    if (rule == null || rule.renderer == null) {
      throw new Error(`レンダリングできないルールです: ${token.ruleName}`);
    } else if (typeof token.children === "string") {
      return rule.renderer(token);
    } else {
      return rule.renderer(token, token.children.map(child => this.render(child)));
    }
  }
}
