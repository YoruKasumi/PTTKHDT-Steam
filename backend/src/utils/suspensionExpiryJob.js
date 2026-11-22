'use strict';

function startSuspensionExpiryJob(accountService, intervalMs = 60_000) {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const expiredCount = await accountService.expireSuspendedAccounts();
      if (expiredCount > 0) {
        console.info(`Automatically expired ${expiredCount} account suspension(s).`);
      }
    } catch (error) {
      console.error('Failed to expire suspended accounts:', error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(run, intervalMs);
  timer.unref();
  void run();
  return () => clearInterval(timer);
}

module.exports = startSuspensionExpiryJob;
