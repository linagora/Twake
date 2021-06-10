import { Message } from './Message';
import Numbers from '../../utils/Numbers';

class MessageHistoryService {
  shouldLimitMessages(loadUp: boolean, firstMessageId: string): boolean {
    const MONTH = 1000 * 60 * 60 * 24 * 30;
    const DELAY = 3 * MONTH;

    const firstMessageTimestamp = Numbers.timeuuidToDate(firstMessageId) * 1000;
    const isFirstMessageOlderOrEqualThanDelay = firstMessageTimestamp >= DELAY;

    console.log({
      firstMessageTimestamp,
      loadUp,
      isFirstMessageOlderOrEqualThanDelay,
      threeMonthsAgo: DELAY,
    });

    // TODO check if message limit is reached with features service

    return isFirstMessageOlderOrEqualThanDelay && loadUp;
  }

  getLimitChannelMessageObject(): Message {
    return {
      id: '0000000-0000-1000-0000-00000000',
      message_type: 2,
      hidden_data: { type: 'limit_channel' },
      creation_date: 0,
    };
  }
}

export default new MessageHistoryService();
