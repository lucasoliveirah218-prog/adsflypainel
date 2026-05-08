import { Router, type IRouter } from "express";
import healthRouter from "./health";
import companiesRouter from "./companies";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/companies", companiesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
