import { Router, type IRouter } from "express";
import healthRouter from "./health";
import iotRouter from "./iot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(iotRouter);

export default router;
