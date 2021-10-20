import { ScheduledTask } from "node-cron";
import { TwakeServiceProvider } from "../../framework";

export type CronJob = () => void;

export type CronExpression = string;

export type CronTask = {
  id: string;
  description: string;
  task: ScheduledTask;
  startDate: number;
  lastRun: number;
  nbRuns: number;
  nbErrors: number;
  lastError?: Error;
  start: () => void;
  stop: () => void;
};

export interface CronAPI extends TwakeServiceProvider {
  /**
   * Schedule a Job
   *
   * @param expression
   * @param job
   * @param callback
   */
  schedule(expression: CronExpression, job: CronJob, description?: string): CronTask;

  /**
   * Get the list of current tasks
   */
  getTasks(): CronTask[];
}
