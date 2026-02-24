import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, lastValueFrom } from 'rxjs';
import { K8sService } from 'src/app/services/k8s.service';
import { KubeVirtService } from 'src/app/services/kube-virt.service';
import { Config } from 'datatables.net';
import { Toasts } from 'src/app/classes/toasts';

@Component({
  selector: 'app-snapshot-list',
  templateUrl: './snapshot-list.component.html',
  styleUrls: ['./snapshot-list.component.css']
})
export class SnapshotListComponent implements OnInit {

    pageName: string = "VM Snapshots";

    snapshotList: any[]      = [];
    namespacesList: string[] = [];

    myToasts!: Toasts;

    /* Skip system namespaces in dropdowns */
    readonly skipNamespaces: string[] = [
        "calico-apiserver", "calico-system", "kube-system", "kube-public",
        "kube-node-lease", "tigera-operator", "kubevirt", "cdi",
        "kubevirt-manager", "cert-manager", "monitoring"
    ];

    snapshotList_dtOptions: Config = {
        paging: false,
        info: false,
        ordering: true,
        orderMulti: true,
        search: true,
        destroy: false,
        stateSave: false,
        serverSide: false,
        columnDefs: [{ orderable: false, targets: 0 }, { orderable: false, targets: 5 }],
        order: [[1, 'asc']],
    };
    snapshotList_dtTrigger: Subject<any> = new Subject<any>();

    constructor(
        private router: Router,
        private k8sService: K8sService,
        private kubeVirtService: KubeVirtService
    ) {}

    async ngOnInit(): Promise<void> {
        let navTitle = document.getElementById("nav-title");
        if(navTitle != null) {
            navTitle.replaceChildren(this.pageName);
        }
        this.myToasts = new Toasts();
        await this.getNamespaces();
        await this.getSnapshots();
        this.snapshotList_dtTrigger.next(null);
    }

    ngOnDestroy() {
        this.snapshotList_dtTrigger.unsubscribe();
    }

    /*
     * Get Namespaces - filter out system namespaces
     */
    async getNamespaces(): Promise<void> {
        try {
            const data = await lastValueFrom(this.k8sService.getNamespaces());
            let nss = data.items;
            for (let i = 0; i < nss.length; i++) {
                if(!this.skipNamespaces.includes(nss[i].metadata["name"])) {
                    this.namespacesList.push(nss[i].metadata["name"]);
                }
            }
        } catch (e: any) {
            console.log(e);
        }
    }

    /*
     * Get All VirtualMachineSnapshots
     */
    async getSnapshots(): Promise<void> {
        this.snapshotList = [];
        try {
            const data = await lastValueFrom(this.k8sService.getVirtualMachineSnapshotsAllNamespaces());
            this.snapshotList = data.items || [];
        } catch (e: any) {
            console.log(e);
        }
    }

    /*
     * Load VM selector for chosen namespace
     */
    async loadVMSelector(namespace: string): Promise<void> {
        try {
            const data = await lastValueFrom(this.kubeVirtService.getVMsNamespaced(namespace));
            let vms = data.items || [];
            let vmSelectorOptions = "";
            for (let i = 0; i < vms.length; i++) {
                vmSelectorOptions += "<option value=\"" + vms[i].metadata["name"] + "\">" + vms[i].metadata["name"] + "</option>\n";
            }
            let selectorVMField = document.getElementById("new-snapshot-vm");
            if(selectorVMField != null) {
                selectorVMField.innerHTML = vmSelectorOptions || "<option value=''>No VMs found</option>";
            }
        } catch (e: any) {
            console.log(e);
        }
    }

    /*
     * Show Info Window
     */
    async showInfo(namespace: string, name: string): Promise<void> {
        let myInnerHTML = "";
        try {
            const data = await lastValueFrom(this.k8sService.getVirtualMachineSnapshotInfo(namespace, name));
            myInnerHTML += "<li class=\"nav-item\">Name: <span class=\"float-right badge bg-primary\">" + data.metadata["name"] + "</span></li>";
            myInnerHTML += "<li class=\"nav-item\">Namespace: <span class=\"float-right badge bg-primary\">" + data.metadata["namespace"] + "</span></li>";
            myInnerHTML += "<li class=\"nav-item\">Creation Time: <span class=\"float-right badge bg-primary\">" + new Date(data.metadata["creationTimestamp"]) + "</span></li>";
            myInnerHTML += "<li class=\"nav-item\">Source VM: <span class=\"float-right badge bg-primary\">" + data.spec.source["name"] + "</span></li>";
            try {
                myInnerHTML += "<li class=\"nav-item\">Ready: <span class=\"float-right badge bg-primary\">" + data.status["readyToUse"] + "</span></li>";
                myInnerHTML += "<li class=\"nav-item\">Phase: <span class=\"float-right badge bg-primary\">" + data.status["phase"] + "</span></li>";
                if(data.status["creationTime"]) {
                    myInnerHTML += "<li class=\"nav-item\">Snapshot Time: <span class=\"float-right badge bg-primary\">" + new Date(data.status["creationTime"]) + "</span></li>";
                }
            } catch (e: any) {
                myInnerHTML += "<li class=\"nav-item\">Ready: <span class=\"float-right badge bg-primary\">Unknown</span></li>";
            }
        } catch (e: any) {
            console.log(e);
        }
        let modalDiv   = document.getElementById("modal-info");
        let modalTitle = document.getElementById("info-title");
        let modalBody  = document.getElementById("info-cards");
        if(modalTitle != null) {
            modalTitle.replaceChildren("Snapshot: " + namespace + " - " + name);
        }
        if(modalBody != null) {
            modalBody.innerHTML = myInnerHTML;
        }
        if(modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade show");
            modalDiv.setAttribute("aria-modal", "true");
            modalDiv.setAttribute("role", "dialog");
            modalDiv.setAttribute("aria-hidden", "false");
            modalDiv.setAttribute("style","display: block;");
        }
    }

    /*
     * Show New Snapshot Window
     */
    async showNew(): Promise<void> {
        let modalDiv = document.getElementById("modal-new");
        let modalTitle = document.getElementById("new-title");
        let selectorNamespacesField = document.getElementById("new-snapshot-namespace") as HTMLSelectElement;

        if(modalTitle != null) {
            modalTitle.replaceChildren("New VM Snapshot");
        }

        /* Load filtered namespace list */
        let nsSelectorOptions = "";
        for (let i = 0; i < this.namespacesList.length; i++) {
            nsSelectorOptions += "<option value=\"" + this.namespacesList[i] + "\">" + this.namespacesList[i] + "</option>\n";
        }
        if(selectorNamespacesField != null) {
            selectorNamespacesField.innerHTML = nsSelectorOptions;
        }

        /* Load VMs for the first selected namespace */
        if(selectorNamespacesField != null && selectorNamespacesField.value != "") {
            await this.loadVMSelector(selectorNamespacesField.value);
        } else if(this.namespacesList.length > 0) {
            await this.loadVMSelector(this.namespacesList[0]);
        }

        if(modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade show");
            modalDiv.setAttribute("aria-modal", "true");
            modalDiv.setAttribute("role", "dialog");
            modalDiv.setAttribute("aria-hidden", "false");
            modalDiv.setAttribute("style","display: block;");
        }
    }

    /*
     * Create VirtualMachineSnapshot
     */
    async applyNew(namespace: string, name: string, vmName: string): Promise<void> {
        if(namespace != null && name != null && vmName != null && name != "" && vmName != "") {
            let thisSnapshot = {
                apiVersion: "snapshot.kubevirt.io/v1beta1",
                kind: "VirtualMachineSnapshot",
                metadata: {
                    name: name,
                    namespace: namespace,
                    labels: {
                        "kubevirt-manager.io/managed": "true"
                    }
                },
                spec: {
                    source: {
                        apiGroup: "kubevirt.io",
                        kind: "VirtualMachine",
                        name: vmName
                    }
                }
            };
            try {
                await lastValueFrom(this.k8sService.createVirtualMachineSnapshot(namespace, thisSnapshot));
                this.hideComponent("modal-new");
                this.myToasts.toastSuccess(this.pageName, "", "Created Snapshot: " + name);
                this.fullReload();
            } catch (e: any) {
                this.myToasts.toastError(this.pageName, "", e.message);
                console.log(e);
            }
        }
    }

    /*
     * Show Delete Window
     */
    showDelete(namespace: string, name: string): void {
        let modalDiv   = document.getElementById("modal-delete");
        let modalTitle = document.getElementById("delete-title");
        let modalBody  = document.getElementById("delete-value");
        if(modalTitle != null) {
            modalTitle.replaceChildren("Delete");
        }
        if(modalBody != null) {
            let nsInput   = document.getElementById("delete-namespace");
            let nameInput = document.getElementById("delete-snapshot");
            if(nsInput != null && nameInput != null) {
                nsInput.setAttribute("value", namespace);
                nameInput.setAttribute("value", name);
                modalBody.replaceChildren("Are you sure you want to delete " + namespace + " - " + name + "?");
            }
        }
        if(modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade show");
            modalDiv.setAttribute("aria-modal", "true");
            modalDiv.setAttribute("role", "dialog");
            modalDiv.setAttribute("aria-hidden", "false");
            modalDiv.setAttribute("style","display: block;");
        }
    }

    /*
     * Delete VirtualMachineSnapshot
     */
    async applyDelete(): Promise<void> {
        let nsField   = document.getElementById("delete-namespace");
        let nameField = document.getElementById("delete-snapshot");
        if(nsField != null && nameField != null) {
            let namespace = nsField.getAttribute("value");
            let name      = nameField.getAttribute("value");
            if(namespace != null && name != null) {
                try {
                    await lastValueFrom(this.k8sService.deleteVirtualMachineSnapshot(namespace, name));
                    this.hideComponent("modal-delete");
                    this.myToasts.toastSuccess(this.pageName, "", "Deleted Snapshot: " + name);
                    this.fullReload();
                } catch (e: any) {
                    this.myToasts.toastError(this.pageName, "", e.message);
                    console.log(e);
                }
            }
        }
    }

    /*
     * Hide Component
     */
    hideComponent(divId: string): void {
        let modalDiv = document.getElementById(divId);
        if(modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade");
            modalDiv.setAttribute("aria-modal", "false");
            modalDiv.setAttribute("role", "");
            modalDiv.setAttribute("aria-hidden", "true");
            modalDiv.setAttribute("style","display: none;");
        }
    }

    /*
     * Full Reload
     */
    fullReload(): void {
        this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/snapshotlist']);
        });
    }
}