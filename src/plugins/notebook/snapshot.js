import { addNotebookEntry, createNewEmbed } from './utils/notebook-entries';
import { getDefaultNotebook } from './utils/notebook-storage';
import { NOTEBOOK_DEFAULT } from '@/plugins/notebook/notebook-constants';
import SnapshotContainer from './snapshot-container';

export default class Snapshot {
    constructor(openmct) {
        this.openmct = openmct;
        this.snapshotContainer = new SnapshotContainer(openmct);
        this.exportImageService = openmct.$injector.get('exportImageService');
        this.dialogService = openmct.$injector.get('dialogService');

        this.capture = this.capture.bind(this);
        this._saveSnapShot = this._saveSnapShot.bind(this);
    }

    capture(snapshotMeta, notebookType, domElement) {
        this.exportImageService.exportPNGtoSRC(domElement, 's-status-taking-snapshot')
            .then(function (blob) {
                const reader = new window.FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    this._saveSnapShot(notebookType, reader.result, snapshotMeta);
                }.bind(this);
            }.bind(this));
    }

    /**
     * @private
     */
    _saveSnapShot(notebookType, imageUrl, snapshotMeta) {
        const snapshot = imageUrl ? { src: imageUrl } : '';
        const embed = createNewEmbed(snapshotMeta, snapshot);
        if (notebookType === NOTEBOOK_DEFAULT) {
            this._saveToDefaultNoteBook(embed);

            return;
        }

        this._saveToNotebookSnapshots(embed);
    }

    /**
     * @private
     */
    _saveToDefaultNoteBook(embed) {
        const notebookStorage = getDefaultNotebook();
        this.openmct.objects.get(notebookStorage.notebookMeta.identifier)
            .then(domainObject => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, embed);

                const link = notebookStorage.notebookMeta.link;
                const defaultPath = `${domainObject.name} - ${notebookStorage.section.name} - ${notebookStorage.page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this._showNotification(msg, link);
            });
    }

    /**
     * @private
     */
    _saveToNotebookSnapshots(embed) {
        this.snapshotContainer.addSnapshot(embed);
    }

    _showNotification(msg, url) {
        const options = {
            autoDismissTimeout: 30000,
            link : {
                callback: this._navigateToNotebook(url),
                cssClass: '',
                label: 'Go to Notebook',
                msg: 'click to view'
            }
        }

        this.openmct.notifications.info(msg, options);
    }

    _navigateToNotebook(url = null) {
        if (!url) {
            return () => {};
        }

        return () => {
            window.location.href = window.location.origin + url;
        }
    }
}
