import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";

export interface MessageServiceAPI extends TwakeServiceProvider, Initializable {}

export interface MessageUserBookmarksServiceAPI extends TwakeServiceProvider, Initializable {}

export interface MessageThreadsServiceAPI extends TwakeServiceProvider, Initializable {}

export interface MessageThreadMessagesServiceAPI extends TwakeServiceProvider, Initializable {}

export interface MessageViewsServiceAPI extends TwakeServiceProvider, Initializable {}
