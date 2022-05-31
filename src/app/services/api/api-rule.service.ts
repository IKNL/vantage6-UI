import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { OpsType, ResType, ScopeType } from 'src/app/shared/enum';
import { Rule, RuleGroup } from 'src/app/interfaces/rule';
import { deepcopy } from 'src/app/shared/utils';

import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/services/common/token-storage.service';
import { ConvertJsonService } from 'src/app/services/common/convert-json.service';
import { ApiService } from 'src/app/services/api/api.service';
import { ModalService } from 'src/app/services/common/modal.service';

@Injectable({
  providedIn: 'root',
})
export class ApiRuleService extends ApiService {
  is_logged_in = false;
  all_rules: Rule[] = [];
  all_rules_bhs = new BehaviorSubject<Rule[]>([]);
  rule_groups: RuleGroup[] = [];
  rule_groups_bhs = new BehaviorSubject<RuleGroup[]>([]);

  constructor(
    protected http: HttpClient,
    protected modalService: ModalService,
    private tokenStorageService: TokenStorageService,
    private convertJsonService: ConvertJsonService
  ) {
    super(ResType.RULE, http, modalService);
    this.tokenStorageService.isLoggedIn().subscribe((is_logged_in) => {
      this.is_logged_in = is_logged_in;
    });
  }

  get_data(rule: Rule) {
    return {
      type: rule.type,
      operation: rule.operation,
      resource: rule.resource,
      scope: rule.scope,
    };
  }

  getRules(): Observable<Rule[]> {
    return this.all_rules_bhs.asObservable();
  }

  getRuleGroups(): Observable<RuleGroup[]> {
    return this.rule_groups_bhs.asObservable();
  }

  getRuleGroupsCopy(): RuleGroup[] {
    return JSON.parse(JSON.stringify(this.rule_groups));
  }

  async getAllRules(): Promise<Rule[]> {
    // if rules are not set, set them (and wait). If already set, return them.
    if (this.all_rules.length === 0) {
      await this.setAllRules();
      this.all_rules_bhs.next(this.all_rules);
    }
    return this.all_rules;
  }

  async setAllRules(): Promise<void> {
    if (this.all_rules.length > 0 || !this.is_logged_in) return;

    // request description of all rules
    const rules = await this.list().toPromise();

    await this._setAllRules(rules);
    this._setRuleGroups();
  }

  private async _setAllRules(all_rules: any[]): Promise<void> {
    this.all_rules = [];
    for (let rule of all_rules) {
      this.all_rules.push(this.convertJsonService.getRule(rule));
    }
  }

  _setRuleGroups(): void {
    // sort rules by resource, then scope, then operation
    this.all_rules = this._sortRules(this.all_rules);

    // divide sorted rules in groups
    this.rule_groups = this._makeRuleGroups();
    this.rule_groups_bhs.next(this.rule_groups);
  }

  _sortRules(rules: Rule[]): Rule[] {
    const resource_order = Object.values(ResType);
    const scope_order = Object.values(ScopeType);
    const operation_order = Object.values(OpsType);
    return rules.sort((a, b) => {
      if (a.resource !== b.resource) {
        return (
          resource_order.indexOf(a.resource) -
          resource_order.indexOf(b.resource)
        );
      } else if (a.scope !== b.scope) {
        return scope_order.indexOf(a.scope) - scope_order.indexOf(b.scope);
      } else {
        return (
          operation_order.indexOf(a.operation) -
          operation_order.indexOf(b.operation)
        );
      }
    });
  }

  _makeRuleGroups(): RuleGroup[] {
    let rule_groups: RuleGroup[] = [];
    let current_rule_group: RuleGroup | undefined = undefined;
    for (let rule of this.all_rules) {
      if (current_rule_group === undefined) {
        // first rule: make new rule group
        current_rule_group = this._newRuleGroup(rule);
      } else if (
        current_rule_group.resource === rule.resource &&
        current_rule_group.scope === rule.scope
      ) {
        // the rule is in the same group as previous rule
        current_rule_group.rules.push(rule);
      } else {
        // New Rule group!
        // First, save the previous rule group
        rule_groups.push(deepcopy(current_rule_group));

        // start new rule group
        current_rule_group = this._newRuleGroup(rule);
      }
    }
    // add last rule group
    if (current_rule_group !== undefined) {
      rule_groups.push(deepcopy(current_rule_group));
    }
    return rule_groups;
  }

  _newRuleGroup(rule: Rule): RuleGroup {
    return {
      resource: rule.resource,
      scope: rule.scope,
      rules: [rule],
    };
  }
}
