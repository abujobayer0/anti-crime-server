import { Router } from "express";
import { CommentController } from "./comment.controller";
import { userRole } from "../Auth/auth.utils";
import Auth from "../../middlewares/auth";

const router = Router();

router.post(
  "/:reportId/comment",
  Auth(userRole.admin, userRole.user),
  CommentController.createComment
);

export const CommentRoutes = router;
