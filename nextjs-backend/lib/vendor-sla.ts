import { db } from './db';

const VENDOR_WARN_DAYS = parseInt(process.env.VENDOR_WARN_DAYS || '5', 10);

const DAY_MS = 24 * 3600 * 1000;

export async function runVendorSlaSweep() {
  try {
    const now = new Date();

    const items = await db.feedback.findMany({
      where: {
        // Avoid using vendorStatus in where clause to stay compatible
        vendorDueAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        vendorAssignedTo: true,
        vendorDueAt: true,
        vendorLastResponseAt: true,
        assignedTo: true,
      },
    });

    let warnings = 0;
    let overdue = 0;

    for (const item of items) {
      if (!item.vendorAssignedTo || !item.vendorDueAt) continue;
      const due = item.vendorDueAt as Date;
      const warnDate = new Date(due.getTime() - VENDOR_WARN_DAYS * DAY_MS);

      // Past due
      if (now > due) {
        try {
          await db.feedback.update({
            where: { id: item.id },
            data: { vendorStatus: 'PAST_DUE' },
          });
        } catch (err) {
          console.error('Vendor SLA update error (PAST_DUE):', err);
        }
        overdue += 1;

        const recipients = [item.vendorAssignedTo, item.assignedTo].filter(Boolean) as number[];
        for (const userId of recipients) {
          await db.notification.create({
            data: {
              userId,
              type: 'FEEDBACK',
              title: 'Vendor task overdue',
              message: `Feedback "${item.title}" vendor response is overdue.`,
              relatedEntityType: 'feedback',
              relatedEntityId: item.id,
            },
          });
        }
        continue;
      }

      // Warning if close to due and no response
      if (!item.vendorLastResponseAt && now >= warnDate) {
        warnings += 1;
        const recipients = [item.vendorAssignedTo, item.assignedTo].filter(Boolean) as number[];
        for (const userId of recipients) {
          await db.notification.create({
            data: {
              userId,
              type: 'FEEDBACK',
              title: 'Vendor response pending',
              message: `Feedback "${item.title}" needs vendor response soon.`,
              relatedEntityType: 'feedback',
              relatedEntityId: item.id,
            },
          });
        }
      }
    }

    return { warnings, overdue };
  } catch (err) {
    console.error('Vendor SLA sweep failed (soft):', err);
    // Do not break main feedback listing if SLA sweep fails
    return { warnings: 0, overdue: 0 };
  }
}
