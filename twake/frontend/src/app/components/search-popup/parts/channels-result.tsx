import React from 'react';
import '../search-popup.scss';
import {useChannel} from "features/channels/hooks/use-channel";
import {useUser} from "features/users/hooks/use-user";
import {Tooltip} from "antd";
import User from 'features/users/services/current-user-service';
import {useWorkspace} from "features/workspaces/hooks/use-workspaces";
import { ChannelType } from 'app/features/channels/types/channel';

type PropsType = {
    channel : ChannelType
    highlight: string
    onClick: any
};

const locale = navigator.languages[0];

const format = (inputDate:Date) => {

    const matchDate = (day:Date)=>
        inputDate.getFullYear() === day.getFullYear() && inputDate.getMonth() === day.getMonth() && inputDate.getDate() === day.getDate();


    const today = new Date();

    if (matchDate(today)){
        return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(inputDate);
    }

    const yesterday = new Date(new Date().setDate(today.getDate()-1));
    if(matchDate(yesterday)){
        return 'yesterday';
    }

    const daysPassed = (today.getTime() - inputDate.getTime())/1000/86400;

    console.log('!!! daysPassed passed',daysPassed);

    if (daysPassed<7){
        return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(inputDate);
    }

    return new Intl.DateTimeFormat(locale).format(inputDate);
};
const MSG_TRIM_LENGTH = 85;

export default ({channel,highlight,onClick}: PropsType): JSX.Element => {

    // const reg = new RegExp('('+highlight+')','ig');
    // const highlightedText = (text:string) => text.replace(reg,"<span class='highlight'>$1</span>");
    // const trimmedText = (text:string)=> (text.length>MSG_TRIM_LENGTH) ? text.substr(0,MSG_TRIM_LENGTH) + '…' : text;
    //
    // const msgDate = () => format(new Date(message.created_at));
    //
    // const sender = useUser(message.user_id);
    // const thumbnail = sender ? User.getThumbnail(sender) : 'data:image/svg+xml;base64, PHN2ZyB3aWR0aD0iNTciIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NyA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjguOTk2MSIgY3k9IjI4IiByPSIyOCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzk1Ml82ODM4NSkiLz4KPGNpcmNsZSBjeD0iMjguOTk2MSIgY3k9IjI4IiByPSIyNy43NSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLW9wYWNpdHk9IjAuMDgiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfOTUyXzY4Mzg1IiB4MT0iMjguOTk2MSIgeTE9IjAiIHgyPSIyOC45OTYxIiB5Mj0iNTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzZFRDFGQiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNkE0RjgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K';

    return (
            <div className="result-item">
                <div className="result-item-icon">
                    <div className="result-item-icon-title">🎯</div>
                </div>
                <div className="result-item-content">
                    <div className="channel-title">{channel.name}</div>
                    <div className="channel-description">{channel.members_count} members</div>
                </div>
                <div className="result-item-postfix"></div>
        </div>);


    // return (
    //   <div className="message-result-item" key={message.id} onClick={onClick}>
    //       <div className="picture">
    //           <svg height="50" width="50">
    //               <circle cx="25" cy="25" r="20" stroke="black" stroke-width="3" fill="#ff5500" />
    //           </svg>
    //       </div>
    //       <div className="text-content">
    //           <div> → </div>
    //           <div></div>
    //
    //       </div>
    //       <div className="date">{getDate()}</div>
    //   </div>
    // );
};
