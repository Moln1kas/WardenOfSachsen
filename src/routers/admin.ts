import { Composer } from 'grammy';
import { adminGuard } from '../middleware/auth';
import { adminModule } from '../modules/admin';
import { logsModule } from '../modules/logs';

export const adminRouter = new Composer();
adminRouter.use(adminGuard);

adminRouter.use(adminModule);
adminRouter.chatType('private').use(logsModule);