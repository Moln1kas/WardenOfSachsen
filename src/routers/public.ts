import { Composer } from 'grammy';
import { joinModule } from '../modules/join';
import { startModule } from '../modules/start';

export const publicRouter = new Composer();

publicRouter.use(joinModule);
publicRouter.use(startModule);