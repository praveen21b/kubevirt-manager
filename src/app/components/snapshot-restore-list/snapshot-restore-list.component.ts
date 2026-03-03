import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, lastValueFrom } from 'rxjs';
import { K8sService } from 'src/app/services/k8s.service';
import { Config } from 'datatables.net';
import { Toasts } from 'src/app/classes/toasts';

@Component({
  selector: 'app-snapshot-restore-list',
  templateUrl: './snapshot-restore-list.component.html',
  styleUrls: ['./snapshot-restore-list.component.css']
})
export class SnapshotRestoreListComponent implements OnInit {

    pageName: string = "VM Restores";

    restoreList: any[]       = [];
    namespacesList: string[] = [];

    myToasts!: Toasts;

    /* Skip system namespaces in dropdowns */
    readonly skipNamespaces: string[] = [
        "calico-apiserver", "calico-system", "kube-system", "kube-public",
        "kube-node-lease", "tigera-operator", "kubevirt", "cdi",
        "kubevirt-manager", "cert-manager", "monitoring"
    ];

    restoreList_dtOptions: Config = {
        paging: false,
        info: false,
        ordering: true,
        orderMulti: true,
        search: true,
        destroy: false,
        stateSave: false,
        serverSide: false,
        columnDefs: [{ orderable: false, targets: 0 }, { orderable: false, targets: 6 }],
        order: [[1, 'asc']],
    };
    restoreList_dtTrigger: Subject<any> = new Subject<any>();

    constructor(
        private router: Router,
        private k8sService: K8sService
    ) {}

    async ngOnInit(): Promise<void> {
        let navTitle = document.getElementById("nav-title");
        if (navTitle != null) {
            navTitle.replaceChildren(this.pageName);
        }
        this.myToasts = new Toasts();
        await this.getNamespaces();
        await this.getRestores();
        this.restoreList_dtTrigger.next(null);
    }

    ngOnDestroy() {
        this.restoreList_dtTrigger.unsubscribe();
    }

    /*
     * Get Namespaces - filter out system namespaces
     */
    async getNamespaces(): Promise<void> {
        try {
            const data = await lastValueFrom(this.k8sService.getNamespaces());
            let nss = data.items;
            for (let i = 0; i < nss.length; i++) {
                if (!this.skipNamespaces.includes(nss[i].metadata["name"])) {
                    this.namespacesList.push(nss[i].metadata["name"]);
                }
            }
        } catch (e: any) {
            console.log(e);
        }
    }

    /*
     * Get All VirtualMachineRestores across all namespaces
     */
    async getRestores(): Promise<void> {
        this.restoreList = [];
        try {
            const data = await lastValueFrom(this.k8sService.getVirtualMachineRestoresAllNamespaces());
            this.restoreList = data.items || [];
        } catch (e: any) {
            console.log(e);
        }
    }

    /*
     * Load Snapshot selector for chosen namespace
     */
    async loadSnapshotSelector(namespace: string): Promise<void> {
        try {
            const data = await lastValueFrom(this.k8sService.getVirtualMachineSnapshots(namespace));
            let snapshots = data.items || [];
            let options = "";
            for (let i = 0; i < snapshots.length; i++) {
                const snapName = snapshots[i].metadata["name"];
                const vmName   = snapshots[i].spec.source["name"];
                options += `<option value="${snapName}">${snapName} (VM: ${vmName})</option>\n`;
            }
            let selectorField = document.getElementById("new-restore-snapshot");
            if (selectorField != null) {
                selectorField.innerHTML = options || "<option value=''>No snapshots found</option>";
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
            const data = await lastValueFrom(this.k8sService.getVirtualMachineRestoreInfo(namespace, name));
            myInnerHTML += `<li class="nav-item">Name: <span class="float-right badge bg-primary">${data.metadata["name"]}</span></li>`;
            myInnerHTML += `<li class="nav-item">Namespace: <span class="float-right badge bg-primary">${data.metadata["namespace"]}</span></li>`;
            myInnerHTML += `<li class="nav-item">Creation Time: <span class="float-right badge bg-primary">${new Date(data.metadata["creationTimestamp"])}</span></li>`;
            myInnerHTML += `<li class="nav-item">Target VM: <span class="float-right badge bg-primary">${data.spec.target["name"]}</span></li>`;
            myInnerHTML += `<li class="nav-item">Snapshot: <span class="float-right badge bg-primary">${data.spec["virtualMachineSnapshotName"]}</span></li>`;
            try {
                myInnerHTML += `<li class="nav-item">Complete: <span class="float-right badge bg-primary">${data.status["complete"]}</span></li>`;
                if (data.status["restoreTime"]) {
                    myInnerHTML += `<li class="nav-item">Restore Time: <span class="float-right badge bg-primary">${new Date(data.status["restoreTime"])}</span></li>`;
                }
                if (data.status["conditions"]) {
                    for (let c of data.status["conditions"]) {
                        myInnerHTML += `<li class="nav-item">${c.type}: <span class="float-right badge bg-primary">${c.status}</span></li>`;
                    }
                }
            } catch (e: any) {
                myInnerHTML += `<li class="nav-item">Status: <span class="float-right badge bg-warning">Unknown</span></li>`;
            }
        } catch (e: any) {
            console.log(e);
        }
        let modalDiv   = document.getElementById("modal-info");
        let modalTitle = document.getElementById("info-title");
        let modalBody  = document.getElementById("info-cards");
        if (modalTitle != null) {
            modalTitle.replaceChildren("Restore: " + namespace + " - " + name);
        }
        if (modalBody != null) {
            modalBody.innerHTML = myInnerHTML;
        }
        if (modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade show");
            modalDiv.setAttribute("aria-modal", "true");
            modalDiv.setAttribute("role", "dialog");
            modalDiv.setAttribute("aria-hidden", "false");
            modalDiv.setAttribute("style", "display: block;");
        }
    }

    /*
     * Show New Restore Window
     */
    async showNew(): Promise<void> {
        let modalDiv = document.getElementById("modal-new");
        let modalTitle = document.getElementById("new-title");
        let selectorNamespacesField = document.getElementById("new-restore-namespace") as HTMLSelectElement;

        if (modalTitle != null) {
            modalTitle.replaceChildren("New VM Restore");
        }

        /* Load filtered namespace list */
        let nsSelectorOptions = "";
        for (let i = 0; i < this.namespacesList.length; i++) {
            nsSelectorOptions += `<option value="${this.namespacesList[i]}">${this.namespacesList[i]}</option>\n`;
        }
        if (selectorNamespacesField != null) {
            selectorNamespacesField.innerHTML = nsSelectorOptions;
        }

        /* Load snapshots for the first selected namespace */
        if (selectorNamespacesField != null && selectorNamespacesField.value != "") {
            await this.loadSnapshotSelector(selectorNamespacesField.value);
        } else if (this.namespacesList.length > 0) {
            await this.loadSnapshotSelector(this.namespacesList[0]);
        }

        if (modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade show");
            modalDiv.setAttribute("aria-modal", "true");
            modalDiv.setAttribute("role", "dialog");
            modalDiv.setAttribute("aria-hidden", "false");
            modalDiv.setAttribute("style", "display: block;");
        }
    }

    /*
     * Create VirtualMachineRestore
     * The restore name, target VM name, and snapshot name are all provided by the user.
     */
    async applyNew(namespace: string, restoreName: string, snapshotName: string, vmName: string): Promise<void> {
        if (namespace && restoreName && snapshotName && vmName) {
            let thisRestore = {
                apiVersion: "snapshot.kubevirt.io/v1beta1",
                kind: "VirtualMachineRestore",
                metadata: {
                    name: restoreName,
                    namespace: namespace,
                    labels: {
                        "kubevirt-manager.io/managed": "true"
                    }
                },
                spec: {
                    target: {
                        apiGroup: "kubevirt.io",
                        kind: "VirtualMachine",
                        name: vmName
                    },
                    virtualMachineSnapshotName: snapshotName
                }
            };
            try {
                await lastValueFrom(this.k8sService.createVirtualMachineRestore(namespace, thisRestore));
                this.hideComponent("modal-new");
                this.myToasts.toastSuccess(this.pageName, "", "Created Restore: " + restoreName);
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
        if (modalTitle != null) {
            modalTitle.replaceChildren("Delete");
        }
        if (modalBody != null) {
            let nsInput   = document.getElementById("delete-namespace");
            let nameInput = document.getElementById("delete-restore");
            if (nsInput != null && nameInput != null) {
                nsInput.setAttribute("value", namespace);
                nameInput.setAttribute("value", name);
                modalBody.replaceChildren("Are you sure you want to delete restore " + namespace + " - " + name + "?");
            }
        }
        if (modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade show");
            modalDiv.setAttribute("aria-modal", "true");
            modalDiv.setAttribute("role", "dialog");
            modalDiv.setAttribute("aria-hidden", "false");
            modalDiv.setAttribute("style", "display: block;");
        }
    }

    /*
     * Delete VirtualMachineRestore
     */
    async applyDelete(): Promise<void> {
        let nsField   = document.getElementById("delete-namespace");
        let nameField = document.getElementById("delete-restore");
        if (nsField != null && nameField != null) {
            let namespace = nsField.getAttribute("value");
            let name      = nameField.getAttribute("value");
            if (namespace != null && name != null) {
                try {
                    await lastValueFrom(this.k8sService.deleteVirtualMachineRestore(namespace, name));
                    this.hideComponent("modal-delete");
                    this.myToasts.toastSuccess(this.pageName, "", "Deleted Restore: " + name);
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
        if (modalDiv != null) {
            modalDiv.setAttribute("class", "modal fade");
            modalDiv.setAttribute("aria-modal", "false");
            modalDiv.setAttribute("role", "");
            modalDiv.setAttribute("aria-hidden", "true");
            modalDiv.setAttribute("style", "display: none;");
        }
    }

    /*
     * Full Reload
     */
    fullReload(): void {
        this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/kubeops-vms/vmrestores']);
        });
    }
}