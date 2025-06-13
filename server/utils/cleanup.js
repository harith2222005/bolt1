import Link from '../models/Link.js';

export const cleanupExpiredLinks = async () => {
  try {
    const now = new Date();
    
    const result = await Link.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: now }
      },
      {
        isActive: false
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Deactivated ${result.modifiedCount} expired links`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return 0;
  }
};

export const cleanupInactiveData = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    
    // Remove old inactive links
    const linkResult = await Link.deleteMany({
      isActive: false,
      updatedAt: { $lt: cutoffDate }
    });

    console.log(`🧹 Removed ${linkResult.deletedCount} old inactive links`);
    
    return {
      linksRemoved: linkResult.deletedCount
    };
  } catch (error) {
    console.error('❌ Cleanup inactive data error:', error);
    return { linksRemoved: 0 };
  }
};