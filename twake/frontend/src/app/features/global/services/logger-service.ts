import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import EnvironmentService from '../../../services/EnvironmentService';

const isProduction = EnvironmentService.isProduction();

isProduction ? log.setDefaultLevel(log.levels.WARN) : log.setDefaultLevel(log.levels.DEBUG);

prefix.reg(log);
prefix.apply(log, {
  template: `${isProduction ? '' : '[%t] '}%l - %n -`,
  levelFormatter(level) {
    return level.toUpperCase();
  },
  nameFormatter(name) {
    return name || 'Twake';
  },
  timestampFormatter(date) {
    return date.toISOString();
  },
});

export default log;
