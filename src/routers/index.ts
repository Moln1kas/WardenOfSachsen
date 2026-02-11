import { Composer } from "grammy";
import { publicRouter } from "./public";
import { adminRouter } from "./admin";
import { groupGuard } from "../middleware/auth";

export const rootRouter = new Composer();
rootRouter.use(groupGuard);

rootRouter.use(publicRouter);
rootRouter.use(adminRouter);