import React, { useEffect, useState } from 'react';
import { Button, Input, Space, message } from 'antd';
import { DeleteOutlined, RetweetOutlined } from '@ant-design/icons';
import Languages from 'services/languages/languages';
import RouterServices from 'services/RouterService';
import './MagicLinks.scss';
import Api from 'app/services/Api';


type PropsType = {
    [key: string]: any;
};

type MagicLinksResponse = {
    token: string
}

class MagicLinksService {

    constructor(protected companyId: string, protected workspaceId: string, protected loading = (arg: boolean) => { }) { }

    private route = `/internal/services/workspaces/v1/companies/${this.companyId}/workspaces/${this.workspaceId}/users/tokens`;

    getCurrentTokens(): Promise<MagicLinksResponse[] | null> {
        this.loading(true);
        return Api.get<{ resources: MagicLinksResponse[] }>(this.route).then((a) => (a.resources) ? a.resources : null).finally(() => this.loading(false));
    }

    recreateToken(): Promise<MagicLinksResponse> {
        this.loading(true);
        return Api.post<any, { resource: MagicLinksResponse }>(this.route, {}).then(a => a.resource).finally(() => this.loading(false));
    }

    deleteToken(token: string): Promise<undefined> {
        this.loading(true);
        return Api.delete(this.route + '/' + token).then(a => undefined).finally(() => this.loading(false));
    }
}



export default (props: PropsType): JSX.Element => {
    const { companyId, workspaceId } = RouterServices.getStateFromRoute();
    const [ready, setReady] = useState(false);
    const [currentToken, setCurrentToken] = useState<string>();
    const [link, setLink] = useState<string>();
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const busy = (val: boolean) => {
        setLoading(val);
        setDisabled(val);
    };

    const magicLinksService = new MagicLinksService(companyId!, workspaceId!, busy);

    useEffect(() => { init();}, []);

    useEffect(() => { setLink(window.location.origin + '/join/' + currentToken); }, [currentToken]);

    const init = () => {
        magicLinksService.getCurrentTokens().then(resources => {
            setCurrentToken(resources ? resources[0].token : undefined);
            setReady(true);
        });
    };

    const onGenerateBtnClick = () => {
        magicLinksService.recreateToken().then(resource => setCurrentToken(resource.token));
        message.success(Languages.t('scenes.app.popup.adduser.magiclinks.new_link_generated'));
    };

    const onDeleteBtnClick = () => {
        if (currentToken) {
            magicLinksService.deleteToken(currentToken).then(() => setCurrentToken(undefined));
        }
    };

    const onCopyBtnClick = async () => {
        navigator.clipboard.writeText(link!);
        message.success(Languages.t('scenes.app.popup.adduser.magiclinks.copied_to_clipboard'));
    };

    const suffix = (<div className="link-input-suffix"><DeleteOutlined onClick={onDeleteBtnClick} style={{ fontSize: 16 }} /><RetweetOutlined onClick={onGenerateBtnClick} /></div>);

    const TokenInput = () =>
    (<Input.Search
        className="link-input"
        disabled={disabled}
        enterButton={Languages.t("scenes.app.popup.adduser.magiclinks.action_copy")}
        defaultValue={link}
        suffix={suffix}
        onSearch={onCopyBtnClick} />);


    const DeleteButton = () => (<Button type="primary" onClick={onGenerateBtnClick} disabled={disabled || props.loading} loading={loading || props.loading}>{Languages.t("scenes.app.popup.adduser.magiclinks.action_generate")}</Button>);

    return ready ? (
        <div className="magic-links">

            <Space direction="vertical" style={{ width: '100%' }}>
                {Languages.t("scenes.app.popup.adduser.magiclinks.genrator_info")}
                {currentToken ? <TokenInput /> : <DeleteButton />}
            </Space>
        </div>
    ) : (<></>);
};


