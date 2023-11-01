import { BullMonitorExpress } from '@bull-monitor/express';
import { BullAdapter } from '@bull-monitor/root/dist/bull-adapter.js';
import Express from 'express';
import basicAuth from 'express-basic-auth';

import { Queue as QueueSync } from './job/sync/sync.queue.js';

const port = 7777;
const baseUrl = '/bull-monitor';

(async () => {
  const app = Express();
  const monitor = new BullMonitorExpress({ queues: [
    new BullAdapter(QueueSync),
  ] });
  await monitor.init();
  app.use(
    baseUrl,
    basicAuth({
      challenge: true,
      users: {
        admin: 'pass',
      },
    })
  );
  app.use(baseUrl, monitor.router);
  app.listen(port, () => console.log(`http://localhost:${port}${baseUrl}`));
})();
