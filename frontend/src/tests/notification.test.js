// Unit test for NotificationContext deduplication logic
function deduplicateNotifications(notifications, newNotif) {
  const isDuplicate = notifications.some(
    (n) => n.incidentId === newNotif.incidentId && n.stage === newNotif.stage
  );
  if (isDuplicate) return notifications;
  return [newNotif, ...notifications];
}

describe('NotificationContext Deduplication Logic', () => {
  it('should add unique event notification', () => {
    const list = [];
    const item1 = { incidentId: 'traffic', stage: 'En Route', title: 'Ambulance En Route' };
    const updated = deduplicateNotifications(list, item1);
    expect(updated.length).toBe(1);
  });

  it('should ignore duplicate event notification for same incident and stage', () => {
    const list = [{ incidentId: 'traffic', stage: 'En Route', title: 'Ambulance En Route' }];
    const item2 = { incidentId: 'traffic', stage: 'En Route', title: 'Duplicate En Route' };
    const updated = deduplicateNotifications(list, item2);
    expect(updated.length).toBe(1);
  });
});
