import React from 'react';
import Observable from 'app/deprecated/CollectionsV1/observable.js';
import Workspace from 'app/deprecated/workspaces/workspaces.js';
import Api from 'app/features/global/framework/api-service';
import {Message} from "features/messages/types/message";
import {ChannelType} from "features/channels/types/channel";

type ResultTypes = {
    messages: Message[]
    channels: ChannelType[]
}

class SearchService extends Observable {
    private results: ResultTypes = {} as ResultTypes;
    private value: string = '';
    private searchHTTPTimeout: any;
    private searchLoading: boolean = false;
    private _isOpen: boolean = false;

    constructor() {
        super();
        this.setObservableName('SearchService');
        // Globals.window.searchPopupService = this;
        this.clear();

    }

    isOpen(){
        return this._isOpen;
    }

    clear() {
        this.setValue('');
        this.results.messages= [];
        this.results.channels= [];
        this.notify();
    }

    open() {
        this._isOpen = true;
        console.log('!!!', 'opening');
        this.notify();
    }

    close() {
        this._isOpen = false;
        this.notify();
    }

    setValue(text:string) {
        this.value = text;
        this.notify();
    }

    // loadMore() {
    //     this.search(true, { more: true });
    // }


    private searchMessages(){
        this.results.messages= [];
        if (this.searchHTTPTimeout) clearTimeout(this.searchHTTPTimeout);
        this.searchHTTPTimeout = setTimeout(() => {
            Api.get<{ resources: Message[] }>(`/internal/services/messages/v1/companies/${Workspace.currentGroupId}/search?q=${this.value}`).then(res=>{
                this.results.messages = res.resources;
                this.notify();
            });
        });
    }

    private searchChannels(){
        this.results.channels= [];
        Api.get<{ resources: ChannelType[] }>(`/internal/services/channels/v1/companies/${Workspace.currentGroupId}/search?q=${this.value}`).then(res=>{
            this.results.channels = res.resources;

        });

    }

    search() {
        this.searchMessages();
        this.searchChannels();
    }




}

const search = new SearchService();
export default search;
