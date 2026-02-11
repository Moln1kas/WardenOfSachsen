import { Composer } from 'grammy';
import { adminGuard } from '../middleware/auth';
import { adminModule } from '../modules/admin';

export const adminRouter = new Composer();
adminRouter.use(adminGuard);

adminRouter.use(adminModule);