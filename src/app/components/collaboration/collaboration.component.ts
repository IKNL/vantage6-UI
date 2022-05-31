import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { Node } from 'src/app/interfaces/node';
import { EMPTY_USER, User } from 'src/app/interfaces/user';
import { Collaboration } from 'src/app/interfaces/collaboration';
import {
  Organization,
  OrganizationInCollaboration,
} from 'src/app/interfaces/organization';
import { arrayContainsObjWithId } from 'src/app/shared/utils';

import { UserPermissionService } from 'src/app/auth/services/user-permission.service';
import { CollabDataService } from 'src/app/services/data/collab-data.service';
import { ConvertJsonService } from 'src/app/services/common/convert-json.service';
import { OrgDataService } from 'src/app/services/data/org-data.service';
import { NodeDataService } from 'src/app/services/data/node-data.service';

@Component({
  selector: 'app-collaboration',
  templateUrl: './collaboration.component.html',
  styleUrls: [
    '../../shared/scss/buttons.scss',
    './collaboration.component.scss',
  ],
})
export class CollaborationComponent implements OnInit {
  organizations: OrganizationInCollaboration[] = [];
  nodes: Node[] = [];
  all_collaborations: Collaboration[] = [];
  my_collaborations: Collaboration[] = [];
  other_collaborations: Collaboration[] = [];
  loggedin_user: User = EMPTY_USER;

  constructor(
    public userPermission: UserPermissionService,
    private nodeDataService: NodeDataService,
    private collabDataService: CollabDataService,
    private orgDataService: OrgDataService,
    private convertJsonService: ConvertJsonService
  ) {}

  ngOnInit(): void {
    this.userPermission.isInitialized().subscribe((ready: boolean) => {
      if (ready) {
        this.init();
      }
    });
  }

  async init() {
    this.loggedin_user = this.userPermission.user;

    // set the nodes
    await this.setNodes();

    // set the organizations
    await this.setOrganizations();

    // set all collaborations
    this.setCollaborations();

    this.updateCollaborations();
  }

  async setCollaborations(): Promise<void> {
    (
      await this.collabDataService.list(
        this.convertJsonService.getCollaboration,
        [this.organizations]
      )
    ).subscribe((collabs: Collaboration[]) => {
      this.all_collaborations = collabs;
      this.updateCollaborations();
    });
  }

  async setOrganizations(): Promise<void> {
    (
      await this.orgDataService.list(this.convertJsonService.getCollaboration, [
        this.organizations,
      ])
    ).subscribe((orgs: Organization[]) => {
      this.organizations = orgs;
      this.updateCollaborations();
    });
  }

  async setNodes(): Promise<void> {
    (
      await this.nodeDataService.list(this.convertJsonService.getNode)
    ).subscribe((nodes: Node[]) => {
      this.nodes = nodes;
      this.updateCollaborations();
    });
  }

  updateCollaborations(): void {
    if (this.all_collaborations.length === 0) return;
    // Delete previous nodes from collabs, then add them back (this updates
    // nodes that were just deleted)
    this.deleteNodesFromCollaborations();
    this.addNodesToCollaborations();

    // Divide collaborations in 2 categories: the ones the logged-in user's
    // organization is involved in and others
    this.my_collaborations = [];
    this.other_collaborations = [];
    for (let c of this.all_collaborations) {
      if (
        arrayContainsObjWithId(
          this.loggedin_user.organization_id,
          c.organizations
        )
      ) {
        this.my_collaborations.push(c);
      } else {
        this.other_collaborations.push(c);
      }
    }
  }

  addNodesToCollaborations(): void {
    for (let c of this.all_collaborations) {
      this.addNodeToCollaboration(c);
    }
  }

  addNodeToCollaboration(c: Collaboration): void {
    for (let o of c.organizations) {
      for (let n of this.nodes) {
        if (o.id === n.organization_id && c.id === n.collaboration_id) {
          o.node = n;
        }
      }
    }
  }

  deleteNodesFromCollaborations(): void {
    for (let c of this.all_collaborations) {
      this.deleteNodesFromCollaboration(c);
    }
  }

  deleteNodesFromCollaboration(c: Collaboration): void {
    for (let o of c.organizations) {
      o.node = undefined;
    }
  }

  deleteCollaboration(col: Collaboration) {}

  editCollaboration(col: Collaboration) {}
}
